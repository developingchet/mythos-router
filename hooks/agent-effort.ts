import type { EngineInterface } from 'claude-code'

import type { EffortLevel } from '../types'

const LEVELS: readonly EffortLevel[] = ['low', 'medium', 'high', 'xhigh', 'max']

/**
 * The `effort` option as a level, or undefined for `auto`, which leaves the
 * agent files as they are. A value outside the options counts as `auto`.
 */
export const configuredEffort = (raw: unknown): EffortLevel | undefined =>
  LEVELS.find(level => level === raw)

export type AgentDefinition = {
  readonly name: string
  readonly description: string
  readonly model?: string
  readonly tools?: readonly string[]
  readonly prompt: string
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
const FIELD = /^([A-Za-z]+):\s*(.*)$/
const KNOWN_FIELDS: ReadonlySet<string> = new Set(['name', 'description', 'model', 'tools'])

const fieldOf = (line: string): readonly [string, string] | undefined => {
  const [, key, value] = FIELD.exec(line) ?? []

  return key === undefined || value === undefined ? undefined : [key, value.trim()]
}

const fieldsOf = (block: string): ReadonlyMap<string, string> =>
  new Map(
    block
      .split(/\r?\n/)
      .map(fieldOf)
      .filter((field): field is readonly [string, string] => field !== undefined),
  )

/**
 * Reads an agent file of this plugin: one-line `key: value` frontmatter, then
 * the system prompt. Anything else is refused rather than half read, so a
 * definition never loses a field such as `tools` on the way.
 */
export const parseAgentFile = (text: string): AgentDefinition | undefined => {
  const [, block, body] = FRONTMATTER.exec(text) ?? []
  if (block === undefined || body === undefined) return undefined

  const fields = fieldsOf(block)
  if ([...fields.keys()].some(key => !KNOWN_FIELDS.has(key))) return undefined

  const name = fields.get('name')
  const description = fields.get('description')
  const prompt = body.trim()
  if (name === undefined || name === '' || description === undefined || description === '' || prompt === '') {
    return undefined
  }

  const tools = fields.get('tools')?.split(',').map(tool => tool.trim()).filter(tool => tool !== '')
  const model = fields.get('model')

  return {
    name,
    description,
    prompt,
    ...(model === undefined || model === '' ? {} : { model }),
    ...(tools === undefined ? {} : { tools }),
  }
}

/**
 * Registers one agent type again from its file, with `effort` added; the
 * registered type replaces the file's definition for the session. Resolves
 * false, leaving the file's definition in place, when the file cannot be read
 * or parsed or the engine refuses the definition.
 */
export async function registerWithEffort($: EngineInterface, name: string, effort: EffortLevel): Promise<boolean> {
  try {
    const definition = parseAgentFile(await $.fs.read(`${$.plugin.root}/agents/${name}.md`))
    if (definition === undefined || definition.name !== name) return false
    await $.agent.register({ ...definition, effort })

    return true
  } catch {
    return false
  }
}
