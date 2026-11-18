import type { EngineInterface } from 'claude-code'

import { newerOf, parseMythos, successors } from './model-id'

const NEWEST_KEY = 'newestModel'
const CHECKED_AT_KEY = 'newestCheckedAt'
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000
const MAX_STEPS = 4
const PROBE_MAX_TOKENS = 16
const PROBE_TIMEOUT_MS = 30_000

/** The newest Mythos ID an earlier check found, kept across sessions. */
export async function storedNewest($: EngineInterface): Promise<string | undefined> {
  const value = await $.store.get(NEWEST_KEY)

  return typeof value === 'string' && parseMythos(value) !== undefined ? value : undefined
}

/**
 * The model Mythos subagents run on: the configured ID, or a newer one a
 * release check found, while `autoUpgrade` is on.
 */
export async function effectiveModel($: EngineInterface, configured: string, autoUpgrade: boolean): Promise<string> {
  return autoUpgrade ? newerOf(configured, await storedNewest($)) : configured
}

// A reply proves the account can use a model, and so does a reply with no
// text: a model that thinks first can spend a small cap before it writes. A
// missing model, refused access, a rate limit and a timeout all leave the
// current choice alone.
async function answers($: EngineInterface, model: string): Promise<boolean> {
  try {
    const reply = await $.model.complete({
      model,
      prompt: 'Reply with OK.',
      maxTokens: PROBE_MAX_TOKENS,
      effort: 'low',
      timeoutMs: PROBE_TIMEOUT_MS,
    })

    return reply.isAnswered || reply.reason === 'empty-reply'
  } catch {
    return false
  }
}

async function probeFrom($: EngineInterface, start: string): Promise<string> {
  let current = start
  for (let step = 0; step < MAX_STEPS; step += 1) {
    let found: string | undefined
    for (const candidate of successors(current)) {
      if (await answers($, candidate)) {
        found = candidate
        break
      }
    }
    if (found === undefined) return current
    current = found
  }

  return current
}

/**
 * Looks for a Mythos release newer than the configured ID and any earlier
 * find, at most once a day unless `isForced`. Stores and resolves the newer
 * ID when one answered, else resolves undefined.
 */
export async function checkForNewer(
  $: EngineInterface,
  configured: string,
  isForced: boolean,
): Promise<string | undefined> {
  const now = await $.clock.now()
  const checkedAt = await $.store.get(CHECKED_AT_KEY)
  const isRecent = typeof checkedAt === 'number' && now - checkedAt < CHECK_INTERVAL_MS
  if (isRecent && !isForced) return undefined

  await $.store.set(CHECKED_AT_KEY, now)
  const before = newerOf(configured, await storedNewest($))
  const after = await probeFrom($, before)
  if (after === before) return undefined

  await $.store.set(NEWEST_KEY, after)

  return after
}
