import { atom, read, update } from 'claude-code'
import type { AgentSpawnInput, EngineInterface, Register } from 'claude-code'

import type { RoutingMode } from '../types'
import { configuredModel } from './model-id'
import { checkForNewer, effectiveModel } from './upgrade'

const COMMAND = 'mythos-subagents'
const AGENT_TYPES = ['general', 'analyst'] as const

// The Agent tool's `model` parameter only takes aliases, so a parent on
// another model cannot ask for Mythos by ID. agents/*.md are Mythos agent
// types that work without this module; the module keeps them on the newest
// Mythos it knows of and, when routing is on, sets other subagents' models.
//
// The atom's plugin name must match plugin.json: only its owner may write it.
const sessionRouting = atom({ plugin: 'mythos-router', key: 'routing' } as const, null as RoutingMode | null)

const MODES: Readonly<Record<string, RoutingMode>> = { on: 'on', all: 'all', off: 'off' }

// Mythos costs twice what Opus does per token, so only the session's owner
// may turn routing on or start a release check: at the prompt, through the
// Remote Control bridge or from an SDK host. Peers, channels, schedules and
// plugins may only turn it off.
const OWNER_ORIGINS: ReadonlySet<string> = new Set(['composer', 'bridge', 'sdk'])

const describeMode = (mode: RoutingMode, model: string): string => {
  if (mode === 'all') return `every new subagent, teammate and workflow agent runs on ${model}`
  if (mode === 'on') return `general-purpose agents run on ${model} unless the caller names a model`

  return 'other subagents keep their own model'
}

const isMythosType = (subagentType: string, plugin: string): boolean =>
  AGENT_TYPES.some(name => subagentType === `${plugin}:${name}`)

// A spawn does not say which model its agent type defines, so `on` routes
// only the agent type known to inherit the parent's model, general-purpose,
// when the caller names no model. Other types, which may define a model of
// their own (Explore, say), keep it.
const inheritsModel = (e: AgentSpawnInput): boolean =>
  e.model === undefined && e.subagentType === 'general-purpose'

const wantsRoute = (e: AgentSpawnInput, mode: RoutingMode): boolean =>
  mode === 'all' || (mode === 'on' && inheritsModel(e))

const checkReply = (found: string | undefined, model: string, autoUpgrade: boolean): string => {
  if (found === undefined) return `No Mythos release newer than ${model} answered.`
  if (autoUpgrade) return `Mythos subagents now run on ${found}.`

  return `${found} answers. Set the model option to it, or turn on autoUpgrade, to use it.`
}

const statusText = (mode: RoutingMode): string | undefined =>
  mode === 'off' ? undefined : `subagents: Mythos (${mode})`

async function currentMode($: EngineInterface, startMode: RoutingMode): Promise<RoutingMode> {
  return (await read($, sessionRouting)) ?? startMode
}

export const register: Register = (on, options) => {
  const { model: configured, isValid } = configuredModel(options.model)
  const startMode = MODES[typeof options.routing === 'string' ? options.routing : 'off'] ?? 'off'
  const autoUpgrade = options.autoUpgrade === true

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Run subagents on Claude Mythos: on, all, off, status, or check for a newer release',
      argumentHint: 'on|all|off|status|check',
    })
    if (!isValid) $.ui.toast(`${$.plugin.name}: the model setting is not a claude-mythos-* ID; using ${configured}`)
    $.ui.status(statusText(await currentMode($, startMode)))

    if (autoUpgrade) {
      void checkForNewer($, configured, false)
        .then(found => found === undefined || $.ui.toast(`Mythos subagents now run on ${found}`))
        .catch(() => undefined)
    }

    return next(e)
  })

  // Forks always inherit the parent's model and a resumed run keeps its own,
  // so neither takes a model rewrite.
  on('agent.spawn', async ($, e, next) => {
    if (e.fork || e.resume !== undefined) return next(e)
    if (!isMythosType(e.subagentType, $.plugin.name) && !wantsRoute(e, await currentMode($, startMode))) {
      return next(e)
    }

    const model = await effectiveModel($, configured, autoUpgrade)
    const started = await next({ ...e, model })
    if (started.deny === undefined && !started.model.includes(model)) {
      $.ui.toast(`${e.subagentType} started on ${started.model}, not ${model}`)
    }

    return started
  }).catch(($, e, next) => next(e))

  on('command.run', { command: COMMAND }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const isOwner = OWNER_ORIGINS.has(e.origin.kind)
    const model = await effectiveModel($, configured, autoUpgrade)
    const wanted = MODES[arg]

    if (wanted !== undefined) {
      if (wanted !== 'off' && !isOwner) return { text: `/${COMMAND} ${arg} can only be turned on by the session's owner.` }
      await update($, sessionRouting, () => wanted)
      $.ui.status(statusText(wanted))

      return {
        text: `Routing ${wanted} for this session: ${describeMode(wanted, model)}. Forks still inherit this session's model.`,
      }
    }

    if (arg === 'check') {
      if (!isOwner) return { text: `/${COMMAND} check can only be run by the session's owner.` }
      const found = await checkForNewer($, configured, true)

      return { text: checkReply(found, model, autoUpgrade) }
    }

    if (arg !== '' && arg !== 'status') return { text: `Usage: /${COMMAND} on|all|off|status|check` }

    const mode = await currentMode($, startMode)
    const types = AGENT_TYPES.map(name => `${$.plugin.name}:${name}`).join(', ')

    return { text: `${types} run on ${model}. Routing ${mode}: ${describeMode(mode, model)}.` }
  }).catch(() => ({ text: `/${COMMAND} failed; check /${COMMAND} status.` }))
}
