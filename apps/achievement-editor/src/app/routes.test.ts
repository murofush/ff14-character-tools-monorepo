import { describe, expect, test } from 'vitest'
import { appRouteItems } from './routes'

/** 目的: 旧Vue側の編集ルート群がReact側へ移行されていることを検証する。副作用: なし。前提: `appRouteItems` が画面責務単位で管理される。 */
describe('appRouteItems', () => {
  test('旧Achievement Editorの主要ルートがすべて存在する', () => {
    const paths: string[] = appRouteItems.map((routeItem) => routeItem.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/battle')
    expect(paths).toContain('/character')
    expect(paths).toContain('/crafting_gathering')
    expect(paths).toContain('/exploration')
    expect(paths).toContain('/grand_company')
    expect(paths).toContain('/items')
    expect(paths).toContain('/legacy')
    expect(paths).toContain('/patch')
    expect(paths).toContain('/pvp')
    expect(paths).toContain('/quests')
    expect(paths).toContain('/tag')
  })
})
