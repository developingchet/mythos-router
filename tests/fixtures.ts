import type {
  AgentSpawnInput,
  CommandRunInput,
  ModelCompleteInput,
  ModelCompleteResult,
  On,
  PromptOrigin,
  SessionStartInput,
} from 'claude-code'

type SpawnArgs = {
  subagentType: string
  model?: string
  fork?: boolean
  resume?: boolean
  isTeammate?: boolean
  workflow?: boolean
}

export const spawnInput = (args: SpawnArgs): AgentSpawnInput => ({
  tool_use_id: 'toolu_test',
  prompt: 'Look into it.',
  description: 'test task',
  subagentType: args.subagentType,
  provider: { plugin: 'engine', tier: 'core' },
  model: args.model,
  parentModel: 'claude-opus-5-5',
  background: true,
  fork: args.fork === true,
  ...(args.resume === true ? { resume: { agentId: 'a-resumed' } } : {}),
  ...(args.isTeammate === true ? { isTeammate: true as const } : {}),
  ...(args.workflow === true ? { workflow: { runId: 'wf_test', agentIndex: 1 } } : {}),
})

export const commandInput = (args: string, kind: PromptOrigin['kind'] = 'composer'): CommandRunInput =>
  ({
    command: 'mythos-subagents',
    args,
    origin: { kind },
    presentation: { isFullscreen: false, columns: 80 },
  }) as CommandRunInput

/** A `-p` run's start, which draws nowhere. */
export const sessionInput = (): SessionStartInput => ({ cwd: '.', surface: null, isInteractive: false })

/** Answers what the plugin's `session.start` hook calls beneath it, and the start itself. */
export const answerSessionStart = (on: On): void => {
  on('session.start', (_$: unknown, e: SessionStartInput) => ({ cwd: e.cwd }))
  on('command.register', (_$: unknown, e: { name: string }) => ({ value: { command: e.name } }))
  on('ui.status', () => ({ value: undefined }))
}

// Shaped as agents/*.md are: one-line frontmatter, then the system prompt.
const AGENT_FILES: Readonly<Record<string, string>> = {
  general: '---\nname: general\ndescription: Runs on Mythos.\nmodel: claude-mythos-5-2\n---\n\nYou are an agent.\n',
  analyst:
    '---\nname: analyst\ndescription: Reads on Mythos.\nmodel: claude-mythos-5-2\ntools: Read, Grep, Glob\n---\n\nYou are a reader.\n',
}

const AGENT_FILE = /[\\/]agents[\\/]([a-z-]+)\.md$/

/** Answers `$.fs.read` of the plugin's agent files; any other path is not found. */
export const answerAgentFiles = (on: On): void => {
  on('fs.read', (_$: unknown, e: { path: string }) => {
    const text = AGENT_FILES[AGENT_FILE.exec(e.path)?.[1] ?? '']
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)

    return { value: text }
  })
}

/** Records the model each spawn reaches the engine with, and starts it on that model. */
export const recordSpawns = (seen: (string | undefined)[]) => (_$: unknown, e: AgentSpawnInput) => {
  seen.push(e.model)

  return { model: e.model ?? e.parentModel, agentId: `a${seen.length}` }
}

type ProbeReply = 'answer' | 'empty' | 'not-found' | 'throw'

/**
 * Stands in for the API beneath `$.model.complete`: each listed model replies
 * as given, and any other model is not found.
 */
export const fakeModels = (replies: Readonly<Record<string, ProbeReply>>, asked: string[]) =>
  (_$: unknown, e: ModelCompleteInput): { value: ModelCompleteResult } => {
    asked.push(e.model)
    const reply = replies[e.model] ?? 'not-found'
    if (reply === 'throw') throw new Error('request refused')
    if (reply === 'answer') return { value: { isAnswered: true, text: 'OK', usage: {} } as ModelCompleteResult }
    if (reply === 'empty') return { value: { isAnswered: false, reason: 'empty-reply' } as ModelCompleteResult }

    return { value: { isAnswered: false, reason: 'api-error', status: 404, error: {} } as ModelCompleteResult }
  }

// The release check is off by default; tests say so where it matters.
export const quiet = { autoUpgrade: false }
