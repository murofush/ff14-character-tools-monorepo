import { describe, expect, it } from 'vitest'
import { normalizeLodestoneInput } from './lodestoneInput'

describe('normalizeLodestoneInput', () => {
  it('Lodestone URLの末尾スラッシュを正規化してcharacterIdを抽出できる', () => {
    const result = normalizeLodestoneInput(
      'https://jp.finalfantasyxiv.com/lodestone/character/31299051/'
    )

    expect(result).toEqual({
      ok: true,
      value: {
        characterId: '31299051',
        profileUrl: 'https://jp.finalfantasyxiv.com/lodestone/character/31299051',
      },
    })
  })

  it('Lodestone URLのクエリ/ハッシュを無視して正規化できる', () => {
    const result = normalizeLodestoneInput(
      'https://jp.finalfantasyxiv.com/lodestone/character/31299051/?foo=bar#section'
    )

    expect(result).toEqual({
      ok: true,
      value: {
        characterId: '31299051',
        profileUrl: 'https://jp.finalfantasyxiv.com/lodestone/character/31299051',
      },
    })
  })

  it('characterIdのみの入力をLodestone URLに正規化できる', () => {
    const result = normalizeLodestoneInput('31299051')

    expect(result).toEqual({
      ok: true,
      value: {
        characterId: '31299051',
        profileUrl: 'https://jp.finalfantasyxiv.com/lodestone/character/31299051',
      },
    })
  })

  it('空文字はrequiredエラーを返す', () => {
    const result = normalizeLodestoneInput('')

    expect(result).toEqual({
      ok: false,
      error: 'required',
    })
  })

  it('不正な入力はinvalid_formatエラーを返す', () => {
    const result = normalizeLodestoneInput('https://example.com/character/31299051')

    expect(result).toEqual({
      ok: false,
      error: 'invalid_format',
    })
  })
})
