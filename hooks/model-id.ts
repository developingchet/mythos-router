export const DEFAULT_MODEL = 'claude-mythos-5-2'

const MYTHOS_ID = /^claude-mythos-(\d{1,3})(?:-(\d{1,3}))?$/

export type MythosVersion = { readonly major: number; readonly minor: number }

export const parseMythos = (id: string): MythosVersion | undefined => {
  const match = MYTHOS_ID.exec(id)
  if (match === null) return undefined

  return { major: Number(match[1]), minor: match[2] === undefined ? 0 : Number(match[2]) }
}

// `claude-mythos-6` is version 6.0, so a zero minor has no suffix.
export const formatMythos = (v: MythosVersion): string =>
  v.minor === 0 ? `claude-mythos-${v.major}` : `claude-mythos-${v.major}-${v.minor}`

const isNewer = (a: MythosVersion, b: MythosVersion): boolean =>
  a.major > b.major || (a.major === b.major && a.minor > b.minor)

/** The newer of two Mythos IDs; a value that is not a Mythos ID loses. */
export const newerOf = (a: string, b: string | undefined): string => {
  const left = parseMythos(a)
  const right = b === undefined ? undefined : parseMythos(b)
  if (right === undefined) return a
  if (left === undefined) return b as string

  return isNewer(right, left) ? (b as string) : a
}

/** The IDs a release after `id` would most likely carry: next minor, then next major. */
export const successors = (id: string): readonly string[] => {
  const v = parseMythos(id)
  if (v === undefined) return []

  return [formatMythos({ major: v.major, minor: v.minor + 1 }), formatMythos({ major: v.major + 1, minor: 0 })]
}

/**
 * The configured model, accepted only as a Mythos ID so a settings value
 * cannot send every subagent to an arbitrary model.
 */
export const configuredModel = (raw: unknown): { readonly model: string; readonly isValid: boolean } => {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (value === '') return { model: DEFAULT_MODEL, isValid: true }

  return parseMythos(value) === undefined
    ? { model: DEFAULT_MODEL, isValid: false }
    : { model: value, isValid: true }
}
