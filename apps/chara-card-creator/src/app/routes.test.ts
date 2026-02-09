import { describe, expect, test } from 'vitest'
import { appRouteItems } from './routes'

/** 目的: 旧Vue互換を含むChara Cardルート群がReact側に定義されることを検証する。副作用: なし。前提: `appRouteItems` が全ルートを集約している。 */
describe('appRouteItems', () => {
  test('旧Vue互換を含む主要ルートが存在する', () => {
    const paths: string[] = appRouteItems.map((routeItem) => routeItem.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/about')
    expect(paths).toContain('/edit-chara-card')
    expect(paths).toContain('/editCharaCard')
    expect(paths).toContain('/select-achievement')
    expect(paths).toContain('/selectAchievement')
  })
})
