import { describe, expect, test } from 'claude-code/testing'

import { configuredModel, newerOf, successors } from '../hooks/model-id'

describe('Mythos model IDs', () => {
  test('successors are the next minor and the next major', () => {
    expect(successors('claude-mythos-5-2')).toEqual(['claude-mythos-5-3', 'claude-mythos-6'])
    expect(successors('claude-mythos-6')).toEqual(['claude-mythos-6-1', 'claude-mythos-7'])
    expect(successors('claude-fable-5-2')).toEqual([])
  })

  test('newerOf compares versions, not strings', () => {
    expect(newerOf('claude-mythos-5-9', 'claude-mythos-5-10')).toBe('claude-mythos-5-10')
    expect(newerOf('claude-mythos-6', 'claude-mythos-5-9')).toBe('claude-mythos-6')
    expect(newerOf('claude-mythos-5-2', undefined)).toBe('claude-mythos-5-2')
    expect(newerOf('claude-mythos-5-2', 'claude-opus-9')).toBe('claude-mythos-5-2')
  })

  test('configuredModel accepts only Mythos IDs', () => {
    expect(configuredModel('  claude-mythos-5-3 ')).toEqual({ model: 'claude-mythos-5-3', isValid: true })
    expect(configuredModel('')).toEqual({ model: 'claude-mythos-5-2', isValid: true })
    expect(configuredModel('claude-opus-5-5')).toEqual({ model: 'claude-mythos-5-2', isValid: false })
    expect(configuredModel('claude-mythos-5-2; rm')).toEqual({ model: 'claude-mythos-5-2', isValid: false })
  })
})
