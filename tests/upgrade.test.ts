import { describe, expect, mock, test } from 'claude-code/testing'

import { commandInput, fakeModels, quiet, recordSpawns, spawnInput } from './fixtures'

const DAY_MS = 24 * 60 * 60 * 1000
const upgrading = { autoUpgrade: true }

describe('check for a newer Mythos', () => {
  test('climbs to the newest release that answers and runs agents on it', { options: upgrading }, async ($, on) => {
    mock.store(on, { newestCheckedAt: DAY_MS * 10 })
    mock.clock(on, { now: DAY_MS * 10 })
    const asked: string[] = []
    const seen: (string | undefined)[] = []
    on('model.complete', fakeModels({ 'claude-mythos-5-3': 'answer', 'claude-mythos-5-4': 'answer' }, asked))
    on('agent.spawn', recordSpawns(seen))

    const reply = await $.command.run(commandInput('check'))
    await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:general' }))

    expect(JSON.stringify(reply)).toContain('now run on claude-mythos-5-4')
    expect(asked).toEqual(['claude-mythos-5-3', 'claude-mythos-5-4', 'claude-mythos-5-5', 'claude-mythos-6'])
    expect(seen).toEqual(['claude-mythos-5-4'])
  })

  test('counts a reply with no text as a model that exists', { options: upgrading }, async ($, on) => {
    mock.store(on, { newestCheckedAt: DAY_MS * 10 })
    mock.clock(on, { now: DAY_MS * 10 })
    const asked: string[] = []
    on('model.complete', fakeModels({ 'claude-mythos-5-3': 'empty' }, asked))

    const reply = await $.command.run(commandInput('check'))

    expect(JSON.stringify(reply)).toContain('now run on claude-mythos-5-3')
  })

  test('treats a refused request as no release', { options: upgrading }, async ($, on) => {
    mock.store(on, { newestCheckedAt: DAY_MS * 10 })
    mock.clock(on, { now: DAY_MS * 10 })
    const asked: string[] = []
    on('model.complete', fakeModels({ 'claude-mythos-5-3': 'throw' }, asked))

    const reply = await $.command.run(commandInput('check'))

    expect(JSON.stringify(reply)).toContain('No Mythos release newer than claude-mythos-5-2')
    expect(asked).toEqual(['claude-mythos-5-3', 'claude-mythos-6'])
  })

  test('with autoUpgrade off, reports a newer release without using it', { options: quiet }, async ($, on) => {
    mock.store(on)
    mock.clock(on, { now: DAY_MS * 10 })
    const asked: string[] = []
    const seen: (string | undefined)[] = []
    on('model.complete', fakeModels({ 'claude-mythos-5-3': 'answer' }, asked))
    on('agent.spawn', recordSpawns(seen))

    const reply = await $.command.run(commandInput('check'))
    await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:general' }))

    expect(JSON.stringify(reply)).toContain('claude-mythos-5-3 answers')
    expect(seen).toEqual(['claude-mythos-5-2'])
  })

  test('a second check with autoUpgrade off still reports the earlier find', { options: quiet }, async ($, on) => {
    mock.store(on)
    mock.clock(on, { now: DAY_MS * 10 })
    const asked: string[] = []
    on('model.complete', fakeModels({ 'claude-mythos-5-3': 'answer' }, asked))

    await $.command.run(commandInput('check'))
    const second = await $.command.run(commandInput('check'))

    expect(JSON.stringify(second)).toContain('claude-mythos-5-3 answers')
  })

  test('a second check with autoUpgrade on says nothing newer than the model in use', { options: upgrading }, async ($, on) => {
    mock.store(on, { newestCheckedAt: DAY_MS * 10 })
    mock.clock(on, { now: DAY_MS * 10 })
    const asked: string[] = []
    on('model.complete', fakeModels({ 'claude-mythos-5-3': 'answer' }, asked))

    await $.command.run(commandInput('check'))
    const second = await $.command.run(commandInput('check'))

    expect(JSON.stringify(second)).toContain('No Mythos release newer than claude-mythos-5-3')
  })

  test('a stored find applies only while autoUpgrade is on', { options: quiet }, async ($, on) => {
    mock.store(on, { newestModel: 'claude-mythos-5-3' })
    const seen: (string | undefined)[] = []
    on('agent.spawn', recordSpawns(seen))

    await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:general' }))

    expect(seen).toEqual(['claude-mythos-5-2'])
  })

  test('a stored find is used while autoUpgrade is on', { options: upgrading }, async ($, on) => {
    mock.store(on, { newestModel: 'claude-mythos-5-3', newestCheckedAt: DAY_MS * 10 })
    mock.clock(on, { now: DAY_MS * 10 })
    const seen: (string | undefined)[] = []
    on('model.complete', fakeModels({}, []))
    on('agent.spawn', recordSpawns(seen))

    await $.agent.spawn(spawnInput({ subagentType: 'mythos-router:general' }))

    expect(seen).toEqual(['claude-mythos-5-3'])
  })

  test('refuses a check that the session owner did not ask for', { options: quiet }, async ($, on) => {
    mock.store(on)
    const asked: string[] = []
    on('model.complete', fakeModels({ 'claude-mythos-5-3': 'answer' }, asked))

    const reply = await $.command.run(commandInput('check', 'channel'))

    expect(JSON.stringify(reply)).toContain("can only be run by the session's owner")
    expect(asked).toEqual([])
  })
})
