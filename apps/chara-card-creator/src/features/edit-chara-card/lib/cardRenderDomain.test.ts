import { describe, expect, it } from 'vitest'
import {
  buildJobIconCandidateUrls,
  buildAchievementRenderItems,
  buildFreeCompanyCrestImageUrls,
  buildPatchDateMap,
  buildProfileDetailLines,
  extractJobEntries,
  extractFreeCompanyPosition,
  resolveResourceImageUrl,
} from './cardRenderDomain'

describe('cardRenderDomain', () => {
  it('patch定義からid->dateマップを構築できる', () => {
    const map = buildPatchDateMap([
      { id: 1, date: '2020-01-01' },
      { id: 2, date: '2021-01-01' },
    ])
    expect(map.get(1)).toBe('2020-01-01')
    expect(map.get(2)).toBe('2021-01-01')
  })

  it('緩和前取得の強調判定を構築できる', () => {
    const patchDateMap = buildPatchDateMap([{ id: 5, date: '2024-01-01' }])
    const items = buildAchievementRenderItems(
      [
        {
          achievementTitle: 'A',
          completedDate: '2023-12-01',
          adjustmentPatchId: 5,
        },
        {
          achievementTitle: 'B',
          completedDate: '2024-12-01',
          adjustmentPatchId: 5,
        },
      ],
      patchDateMap,
      false,
      '♂'
    )
    expect(items[0]?.isUnlockedBeforeAdjustment).toBe(true)
    expect(items[1]?.isUnlockedBeforeAdjustment).toBe(false)
  })

  it('強調無効時は緩和前取得でも強調しない', () => {
    const patchDateMap = buildPatchDateMap([{ id: 2, date: '2024-01-01' }])
    const items = buildAchievementRenderItems(
      [
        {
          achievementTitle: 'A',
          completedDate: '2023-10-01',
          adjustmentPatchId: 2,
        },
      ],
      patchDateMap,
      true,
      '♀'
    )
    expect(items[0]?.isUnlockedBeforeAdjustment).toBe(false)
  })

  it('称号/アイテム報酬の表示文を性別に応じて構築できる', () => {
    const patchDateMap = buildPatchDateMap([])
    const items = buildAchievementRenderItems(
      [
        {
          achievementTitle: 'A',
          adjustmentPatchId: 0,
          titleAwardMan: 'The Brave',
          titleAwardWoman: 'The Brave Lady',
          itemAward: 'Rare Item',
          itemAwardImagePath: '/achievementData/img/items/group/icon.png',
        },
      ],
      patchDateMap,
      false,
      '♀'
    )

    expect(items[0]?.titleAwardLabel).toBe('Title: <The Brave Lady>')
    expect(items[0]?.itemAwardLabel).toBe('Item: Rare Item')
    expect(items[0]?.itemAwardImageUrl).toBe(
      'https://forfan-resource.storage.googleapis.com/achievementData/img/items/group/icon.png'
    )
  })

  it('characterDataからjobレベル一覧を抽出できる', () => {
    const jobs = extractJobEntries({
      battleRoles: {
        tank: {
          paladin: { name: 'Paladin', level: 90 },
          warrior: { name: 'Warrior', level: 80 },
        },
      },
      crafter: {
        carpenter: { name: 'Carpenter', level: 100 },
      },
    })

    expect(jobs).toContainEqual(
      expect.objectContaining({
        category: 'battleRoles',
        group: 'tank',
        jobKey: 'paladin',
        jobName: 'Paladin',
        level: 90,
      })
    )
    expect(jobs).toContainEqual(
      expect.objectContaining({
        category: 'crafter',
        group: 'crafter',
        jobKey: 'carpenter',
        jobName: 'Carpenter',
        level: 100,
      })
    )
    expect(jobs[0]?.iconCandidateUrls.length).toBeGreaterThan(0)
  })

  it('表示用プロフィール行を生成できる', () => {
    const lines = buildProfileDetailLines(
      {
        freecompanyInfo: {
          fcName: 'FC Name',
        },
        characterData: {
          pvpTeamInfo: {
            name: 'PvP Team',
          },
          battleRoles: {
            tank: {
              paladin: { name: 'Paladin', level: 90 },
            },
          },
        },
      },
      2
    )
    expect(lines[0]).toContain('FC: FC Name')
    expect(lines[1]).toContain('PvP: PvP Team')
    expect(lines.some((line) => line.includes('Paladin Lv90'))).toBe(true)
  })

  it('FCクレストと所属階級情報を抽出できる', () => {
    const crestUrls = buildFreeCompanyCrestImageUrls({
      fcCrestBaseImageUrls: ['/img/1.png', '/img/2.png'],
    })
    expect(crestUrls[0]).toBe('https://forfan-resource.storage.googleapis.com/img/fc_bg.png')
    expect(crestUrls[1]).toBe('https://forfan-resource.storage.googleapis.com/img/1.png')

    const position = extractFreeCompanyPosition({
      positionBaseImageUrl: '/img/position.png',
      positionName: 'Officer',
    })
    expect(position.positionImageUrl).toBe('https://forfan-resource.storage.googleapis.com/img/position.png')
    expect(position.positionName).toBe('Officer')
  })

  it('URLまたは相対パスを正規化できる', () => {
    expect(resolveResourceImageUrl('https://example.com/a.png')).toBe('https://example.com/a.png')
    expect(resolveResourceImageUrl('/a/b.png')).toBe('https://forfan-resource.storage.googleapis.com/a/b.png')
  })

  it('ジョブアイコン候補URLをフォールバック順で構築できる', () => {
    const urls = buildJobIconCandidateUrls('darkKnight')
    expect(urls[0]).toContain('/img/job/sub/darkknight.')
    expect(urls.some((url) => url.includes('/img/job/sub/drk.'))).toBe(true)
    expect(urls.some((url) => url.includes('/img/class_job/dark_knight.'))).toBe(true)
  })
})
