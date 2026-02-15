import { describe, expect, test } from 'vitest'
import {
  addTopLevelTagDefinition,
  deleteTagDefinitionByPathWithPromote,
  indentTagDefinition,
  moveTagDefinitionDown,
  moveTagDefinitionUp,
  outdentTagDefinition,
  sortTagDefinitionsRecursiveById,
} from './tagHierarchyDomain'
import { type TagDefinitionModel } from '../model/types'

/** 目的: テスト用のタグツリーを生成する。副作用: なし。前提: idは重複しない。 */
function createTagTree(): TagDefinitionModel[] {
  return [
    {
      id: 1,
      name: 'Tag 1',
      tags: [],
    },
    {
      id: 3,
      name: 'Tag 3',
      tags: [
        {
          id: 4,
          name: 'Tag 4',
          tags: [],
        },
      ],
    },
    {
      id: 2,
      name: 'Tag 2',
      tags: [],
    },
  ]
}

describe('tagHierarchyDomain', () => {
  test('トップレベル追加でID順に整列する', () => {
    const tags = createTagTree()
    const result = addTopLevelTagDefinition(tags, {
      id: 0,
      name: 'Tag 0',
      tags: [],
    })
    expect(result.map((tag) => tag.id)).toEqual([0, 1, 2, 3])
  })

  test('上移動/下移動で同階層の順序を変更できる', () => {
    const tags = sortTagDefinitionsRecursiveById(createTagTree())
    const movedDown = moveTagDefinitionDown(tags, [0])
    expect(movedDown.map((tag) => tag.id)).toEqual([2, 1, 3])

    const movedUp = moveTagDefinitionUp(movedDown, [1])
    expect(movedUp.map((tag) => tag.id)).toEqual([1, 2, 3])
  })

  test('子へ移動で直前兄弟の子タグへネストできる', () => {
    const tags = sortTagDefinitionsRecursiveById(createTagTree())
    const result = indentTagDefinition(tags, [1])

    expect(result.map((tag) => tag.id)).toEqual([1, 3])
    expect(result[0].tags.map((tag) => tag.id)).toEqual([2])
  })

  test('親へ移動で親階層へ戻せる', () => {
    const tags = sortTagDefinitionsRecursiveById(createTagTree())
    const result = outdentTagDefinition(tags, [2, 0])

    expect(result.map((tag) => tag.id)).toEqual([1, 2, 3, 4])
    expect(result[2].tags).toEqual([])
  })

  test('削除で子タグをトップレベルへ昇格できる', () => {
    const tags = sortTagDefinitionsRecursiveById(createTagTree())
    const result = deleteTagDefinitionByPathWithPromote(tags, [2])

    expect(result.removed).toBe(true)
    expect(result.tags.map((tag) => tag.id)).toEqual([1, 2, 4])
  })
})
