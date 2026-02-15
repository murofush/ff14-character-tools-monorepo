import { describe, expect, test, vi } from 'vitest'
import {
  buildAllAchievementSaveTargets,
  buildEditedAchievementPath,
  buildPatchDefinitionPath,
  saveEditorStateByRouteToBackend,
  buildSaveTextRequestBody,
  buildTagDefinitionPath,
  routeKeysForAchievementEditor,
  routeCategoryPathMap,
} from './editorDataSource'
import {
  fromRawEditedAchievementFile,
  toRawEditedAchievementFile,
  type RawEditedAchievementFile,
} from './editorDataContract'
import {
  configureAuthTokenProvider,
  configureStaticBearerToken,
} from '../../auth/lib/authTokenClient'
import { type AchievementEditorState } from '../model/types'

describe('editor data contract', () => {
  test('routeごとのcategory path一覧を返す', () => {
    expect(routeCategoryPathMap.battle).toContain('battle')
    expect(routeCategoryPathMap.character).toContain('general')
    expect(routeCategoryPathMap.pvp).toContain('frontline')
  })

  test('editedAchievementData の保存/取得パスを生成する', () => {
    expect(buildEditedAchievementPath('battle', 'dungeons')).toBe(
      'editedAchievementData/battle/dungeons.json'
    )
  })

  test('tag / patch 定義の保存/取得パスを生成する', () => {
    expect(buildTagDefinitionPath()).toBe('tag/tag.json')
    expect(buildPatchDefinitionPath()).toBe('patch/patch.json')
  })

  test('旧JSON形式をEditorカテゴリへ変換し、再度旧JSONへ戻せる', () => {
    const raw: RawEditedAchievementFile = {
      title: 'battle',
      categorized: [
        {
          title: '未分類',
          data: [
            {
              title: 'Draft A',
              description: 'draft',
              sourceIndex: -1,
              tagIds: [10],
              patchId: 2,
              adjustmentPatchId: 1,
            },
          ],
        },
        {
          title: '討伐数',
          data: [
            {
              title: 'Kill 100',
              description: 'kill',
              sourceIndex: 0,
              tagIds: [1, 2],
              patchId: 3,
              adjustmentPatchId: 0,
            },
          ],
        },
      ],
    }

    const category = fromRawEditedAchievementFile(raw)
    expect(category.path).toBe('battle')
    expect(category.ungroup).toHaveLength(1)
    expect(category.group).toHaveLength(1)
    expect(category.group[0].title).toBe('討伐数')

    const reverted = toRawEditedAchievementFile(category)
    expect(reverted.title).toBe('battle')
    expect(reverted.categorized).toHaveLength(2)
  })

  test('save_text 用のボディを構築する', () => {
    const raw: RawEditedAchievementFile = {
      title: 'battle',
      categorized: [],
    }
    const body = buildSaveTextRequestBody('battle', 'battle', raw)
    expect(body.path).toBe('editedAchievementData/battle/battle.json')
    expect(body.text).toContain('"title"')
  })

  test('全カテゴリ保存対象をroute順で列挙する', () => {
    const targets = buildAllAchievementSaveTargets(routeKeysForAchievementEditor)
    expect(targets).toContainEqual({ routeKey: 'battle', categoryPath: 'battle' })
    expect(targets).toContainEqual({ routeKey: 'items', categoryPath: 'items' })
    expect(targets.some((target) => target.routeKey === 'tag')).toBe(false)
  })

  test('ルート内の全カテゴリをsave_textへ保存する', async () => {
    const editorState: AchievementEditorState = {
      key: 'battle',
      kindName: 'Battle',
      achievementCategories: [
        {
          title: 'battle',
          path: 'battle',
          ungroup: [],
          group: [],
        },
        {
          title: 'dungeons',
          path: 'dungeons',
          ungroup: [],
          group: [],
        },
      ],
    }

    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response('{}', { status: 200 })
    })

    configureAuthTokenProvider(null)
    configureStaticBearerToken('test-token')
    try {
      await saveEditorStateByRouteToBackend(editorState, {
        backendBaseUrl: 'https://example.com',
        fetcher,
      })
    } finally {
      configureStaticBearerToken(null)
    }

    expect(fetcher).toHaveBeenCalledTimes(2)
    const savedPaths = fetcher.mock.calls.map(([, init]) => {
      const payload = JSON.parse(String(init?.body)) as { path: string }
      return payload.path
    })
    expect(savedPaths).toContain('editedAchievementData/battle/battle.json')
    expect(savedPaths).toContain('editedAchievementData/battle/dungeons.json')
  })
})
