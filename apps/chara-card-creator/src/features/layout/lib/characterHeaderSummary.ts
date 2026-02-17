import {
  extractCharacterDisplayName,
  extractCharacterMetaLine,
} from '../../edit-chara-card/lib/cardEditorDomain'
import { buildProfileDetailLines } from '../../edit-chara-card/lib/cardRenderDomain'
import { type CharacterSessionResponse } from '../../select-achievement/model/types'

export type CharacterHeaderSummary = {
  characterName: string
  characterMetaLine: string
  profileDetailLines: string[]
  lodestoneProfileUrl: string
}

/** 目的: ヘッダのキャラクター情報メニュー表示へ必要な要約を構築する。副作用: なし。前提: session は `get_character_info` 互換レスポンスである。 */
export function buildCharacterHeaderSummary(
  session: CharacterSessionResponse | null
): CharacterHeaderSummary | null {
  if (!session) {
    return null
  }

  const characterName: string = extractCharacterDisplayName(session.characterData)
  const characterMetaLine: string = extractCharacterMetaLine(session.characterData)
  const profileDetailLines: string[] = buildProfileDetailLines(session, 2).slice(0, 3)

  return {
    characterName,
    characterMetaLine,
    profileDetailLines,
    lodestoneProfileUrl: `https://jp.finalfantasyxiv.com/lodestone/character/${session.characterID}`,
  }
}
