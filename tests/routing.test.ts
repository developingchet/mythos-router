import { describe, expect, mock, test } from 'claude-code/testing'

import { commandInput, quiet, recordSpawns, spawnInput } from './fixtures'

describe('Mythos agent types', () => {
  test('run on the configured model even when the caller names another', { options: quiet }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:general', model: 'haiku' }))
    await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:analyst' }))

    expect(seen).toEqual(['claude-mythos-5-2', 'claude-mythos-5-2'])
  })

  test('take a newer Mythos ID from the model option', { options: { ...quiet, model: 'claude-mythos-5-3' } }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:general' }))

    expect(seen).toEqual(['claude-mythos-5-3'])
  })

  test('ignore a model option that is not a Mythos ID', { options: { ...quiet, model: 'claude-haiku-5-5' } }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:general' }))

    expect(seen).toEqual(['claude-mythos-5-2'])
  })

  test('leave forks and resumed agents alone', { options: quiet }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.command.run(commandInput('all'))
    await $.agent.spawn(spawnInput({ subagentType: 'fork', fork: true }))
    await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:general', resume: true }))

    expect(seen).toEqual([undefined, undefined])
  })

  test('pass a refused spawn through unchanged', { options: quiet }, async ($, on) => {
    mock.store(on)
    on('agent.spawn', () => ({ deny: 'too many agents' }))

    const started = await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:general' }))

    expect(started).toEqual({ deny: 'too many agents' })
  })
})

describe('routing modes', () => {
  test('off leaves other agent types alone', { options: quiet }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.agent.spawn(spawnInput({ subagentType: 'general-purpose' }))
    await $.agent.spawn(spawnInput({ subagentType: 'Explore', model: 'haiku' }))

    expect(seen).toEqual([undefined, 'haiku'])
  })

  test('on routes general-purpose agents that name no model, and nothing else', { options: quiet }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.command.run(commandInput('on'))
    await $.agent.spawn(spawnInput({ subagentType: 'general-purpose' }))
    await $.agent.spawn(spawnInput({ subagentType: 'general-purpose', model: 'sonnet' }))
    await $.agent.spawn(spawnInput({ subagentType: 'Explore' }))
    await $.agent.spawn(spawnInput({ subagentType: 'scanner', workflow: true }))

    expect(seen).toEqual(['claude-mythos-5-2', 'sonnet', undefined, undefined])
  })

  test('all routes subagents, teammates and workflow agents until switched off', { options: quiet }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.command.run(commandInput('all'))
    await $.agent.spawn(spawnInput({ subagentType: 'Explore', model: 'haiku' }))
    await $.agent.spawn(spawnInput({ subagentType: 'reviewer', isTeammate: true }))
    await $.agent.spawn(spawnInput({ subagentType: 'scanner', workflow: true }))
    await $.command.run(commandInput('off'))
    await $.agent.spawn(spawnInput({ subagentType: 'Explore', model: 'haiku' }))

    expect(seen).toEqual(['claude-mythos-5-2', 'claude-mythos-5-2', 'claude-mythos-5-2', 'haiku'])
  })

  test('the routing option sets the mode a session starts in', { options: { ...quiet, routing: 'all' } }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.agent.spawn(spawnInput({ subagentType: 'Explore', model: 'haiku' }))
    await $.command.run(commandInput('off'))
    await $.agent.spawn(spawnInput({ subagentType: 'Explore', model: 'haiku' }))

    expect(seen).toEqual(['claude-mythos-5-2', 'haiku'])
  })

  test('an unknown routing option starts with routing off', { options: { ...quiet, routing: 'everything' } }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.agent.spawn(spawnInput({ subagentType: 'general-purpose' }))

    expect(seen).toEqual([undefined])
  })

  test('the session owner can turn routing on from the prompt, Remote Control or an SDK host', { options: quiet }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    for (const kind of ['composer', 'bridge', 'sdk'] as const) {
      await $.command.run(commandInput('off'))
      await $.command.run(commandInput('all', kind))
      await $.agent.spawn(spawnInput({ subagentType: 'Explore', model: 'haiku' }))
    }

    expect(seen).toEqual(['claude-mythos-5-2', 'claude-mythos-5-2', 'claude-mythos-5-2'])
  })

  test('others cannot turn routing on but can turn it off', { options: { ...quiet, routing: 'all' } }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.command.run(commandInput('off', 'peer'))
    const refused = await $.command.run(commandInput('all', 'channel'))
    await $.agent.spawn(spawnInput({ subagentType: 'Explore', model: 'haiku' }))

    expect(JSON.stringify(refused)).toContain("only be turned on by the session's owner")
    expect(seen).toEqual(['haiku'])
  })

  test('status and usage answer without changing the mode', { options: quiet }, async ($, on) => {
    mock.store(on)
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    const status = await $.command.run(commandInput('status'))
    const usage = await $.command.run(commandInput('sideways'))
    await $.agent.spawn(spawnInput({ subagentType: 'general-purpose' }))

    expect(JSON.stringify(status)).toContain('Routing off')
    expect(JSON.stringify(usage)).toContain('Usage: /mythos-subagents')
    expect(seen).toEqual([undefined])
  })
})
