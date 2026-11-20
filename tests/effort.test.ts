import { describe, expect, mock, test } from 'claude-code/testing'
import type { AgentSpec, On } from 'claude-code'

import { configuredEffort, parseAgentFile } from '../hooks/agent-effort'
import { answerAgentFiles, answerSessionStart, commandInput, quiet, sessionInput } from './fixtures'

/** Records each agent type the plugin registers, and accepts it. */
const recordRegistrations = (seen: AgentSpec[]) => (_$: unknown, e: AgentSpec) => {
  seen.push(e)

  return { value: { agent: `mythos-router:${e.name}` } }
}

describe('the effort option', () => {
  test('takes the five levels and treats anything else as auto', () => {
    expect(['low', 'medium', 'high', 'xhigh', 'max'].map(configuredEffort)).toEqual([
      'low',
      'medium',
      'high',
      'xhigh',
      'max',
    ])
    expect([undefined, 'auto', 'HIGH', 3, ''].map(configuredEffort)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })
})

describe('agent files', () => {
  test('parse into a definition that keeps the tool list', () => {
    const text = '---\nname: analyst\ndescription: Reads.\nmodel: claude-mythos-5-2\ntools: Read, Grep, Glob\n---\n\nYou read.\n'

    expect(parseAgentFile(text)).toEqual({
      name: 'analyst',
      description: 'Reads.',
      model: 'claude-mythos-5-2',
      tools: ['Read', 'Grep', 'Glob'],
      prompt: 'You read.',
    })
  })

  test('with a field the parser does not know are refused', () => {
    expect(parseAgentFile('---\nname: a\ndescription: d\ndisallowedTools: Bash\n---\nPrompt.\n')).toBeUndefined()
  })

  test('without frontmatter, a description or a prompt are refused', () => {
    expect(parseAgentFile('name: a\n')).toBeUndefined()
    expect(parseAgentFile('---\nname: a\n---\nPrompt.\n')).toBeUndefined()
    expect(parseAgentFile('---\nname: a\ndescription: d\n---\n\n')).toBeUndefined()
  })
})

/** Stands in for the engine beneath a session start, and returns the toasts it shows. */
const startBeneath = (on: On): string[] => {
  const toasts: string[] = []
  mock.store(on)
  answerSessionStart(on)
  answerAgentFiles(on)
  on('ui.toast', (_$: unknown, e: { text: string }) => {
    toasts.push(e.text)

    return { value: undefined }
  })

  return toasts
}

describe('Mythos agent effort', () => {
  test('auto leaves the agent files alone', { options: quiet }, async ($, on) => {
    const toasts = startBeneath(on)
    const seen: AgentSpec[] = []
    on('agent.register', recordRegistrations(seen))

    await $.session.start(sessionInput())

    expect(seen).toEqual([])
    expect(toasts).toEqual([])
  })

  test('a level registers both agent types again with it', { options: { ...quiet, effort: 'xhigh' } }, async ($, on) => {
    const toasts = startBeneath(on)
    const seen: AgentSpec[] = []
    on('agent.register', recordRegistrations(seen))

    await $.session.start(sessionInput())

    expect(seen).toEqual([
      {
        name: 'general',
        description: 'Runs on Mythos.',
        model: 'claude-mythos-5-2',
        prompt: 'You are an agent.',
        effort: 'xhigh',
      },
      {
        name: 'analyst',
        description: 'Reads on Mythos.',
        model: 'claude-mythos-5-2',
        tools: ['Read', 'Grep', 'Glob'],
        prompt: 'You are a reader.',
        effort: 'xhigh',
      },
    ])
    expect(toasts).toEqual([])
  })

  test('a refused registration keeps the file and says so', { options: { ...quiet, effort: 'high' } }, async ($, on) => {
    const toasts = startBeneath(on)
    on('agent.register', (_$: unknown, e: AgentSpec) => {
      if (e.name === 'analyst') throw new Error('refused')

      return { value: { agent: `mythos-router:${e.name}` } }
    })

    await $.session.start(sessionInput())

    expect(toasts).toEqual(["mythos-router: mythos-router:analyst run at the model's default effort, not high"])
  })

  test('status names the level', { options: { ...quiet, effort: 'max' } }, async ($, on) => {
    startBeneath(on)

    const reply = await $.command.run(commandInput('status'))

    expect(reply.text).toContain('run on claude-mythos-5-2 at max effort')
  })

  test("status names the model's default under auto", { options: quiet }, async ($, on) => {
    startBeneath(on)

    const reply = await $.command.run(commandInput('status'))

    expect(reply.text).toContain("run on claude-mythos-5-2 at the model's default effort")
  })
})
