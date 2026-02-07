const LODESTONE_CHARACTER_BASE_URL =
  'https://jp.finalfantasyxiv.com/lodestone/character'
const LODESTONE_CHARACTER_PAGE_PATTERN =
  /^https:\/\/jp\.finalfantasyxiv\.com\/lodestone\/character\/([0-9]+)\/?$/
const CHARACTER_ID_PATTERN = /^[0-9]+$/

export interface NormalizedLodestoneInput {
  characterId: string
  profileUrl: string
}

export type NormalizeLodestoneInputError = 'required' | 'invalid_format'

export type NormalizeLodestoneInputResult =
  | {
      ok: true
      value: NormalizedLodestoneInput
    }
  | {
      ok: false
      error: NormalizeLodestoneInputError
    }

/**
 * 目的: Lodestone URL/ID入力をReact側で扱える正規形に変換する。
 * 副作用: なし（純関数）。
 * 前提: 入力はユーザーの生文字列であり、空文字・URL・IDのいずれも取り得る。
 */
export function normalizeLodestoneInput(
  rawInput: string
): NormalizeLodestoneInputResult {
  const trimmedInput = rawInput.trim()
  if (trimmedInput === '') {
    return {
      ok: false,
      error: 'required',
    }
  }

  const sanitizedInput = trimQueryAndHash(trimmedInput)
  const urlMatch = sanitizedInput.match(LODESTONE_CHARACTER_PAGE_PATTERN)
  if (urlMatch?.[1]) {
    const characterId = urlMatch[1]
    return {
      ok: true,
      value: {
        characterId,
        profileUrl: `${LODESTONE_CHARACTER_BASE_URL}/${characterId}`,
      },
    }
  }

  if (CHARACTER_ID_PATTERN.test(sanitizedInput)) {
    return {
      ok: true,
      value: {
        characterId: sanitizedInput,
        profileUrl: `${LODESTONE_CHARACTER_BASE_URL}/${sanitizedInput}`,
      },
    }
  }

  return {
    ok: false,
    error: 'invalid_format',
  }
}

/**
 * 目的: URL検証前にクエリ/ハッシュ由来のノイズを除去する。
 * 副作用: なし（純関数）。
 * 前提: `value` はtrim済み文字列である。
 */
function trimQueryAndHash(value: string): string {
  return value.split(/[?#]/)[0] ?? ''
}
