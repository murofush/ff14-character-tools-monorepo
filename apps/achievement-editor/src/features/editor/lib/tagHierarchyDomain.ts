import { type TagDefinitionModel } from '../model/types'

export type TagPath = number[]

/** 目的: タグ定義ツリーをディープコピーする。副作用: なし。前提: tags はJSONシリアライズ可能な構造である。 */
function cloneTags(tags: TagDefinitionModel[]): TagDefinitionModel[] {
  return JSON.parse(JSON.stringify(tags)) as TagDefinitionModel[]
}

/** 目的: 階層パスに対応する siblings 配列を返す。副作用: なし。前提: path は現行tags上の有効な配列インデックス列である。 */
function getSiblingsByPath(rootTags: TagDefinitionModel[], path: TagPath): TagDefinitionModel[] | null {
  if (path.length === 0) {
    return null
  }
  if (path.length === 1) {
    return rootTags
  }
  let currentTags = rootTags
  for (let depth = 0; depth < path.length - 1; depth += 1) {
    const currentTag = currentTags[path[depth]]
    if (!currentTag || !Array.isArray(currentTag.tags)) {
      return null
    }
    if (depth === path.length - 2) {
      return currentTag.tags
    }
    currentTags = currentTag.tags
  }
  return null
}

/** 目的: タグIDで兄弟配列を再帰ソートする。副作用: なし。前提: id は整数である。 */
export function sortTagDefinitionsRecursiveById(tags: TagDefinitionModel[]): TagDefinitionModel[] {
  return [...tags]
    .map((tag) => ({
      ...tag,
      tags: sortTagDefinitionsRecursiveById(Array.isArray(tag.tags) ? tag.tags : []),
    }))
    .sort((a, b) => a.id - b.id)
}

/** 目的: トップレベルへ新規タグを追加し、ID昇順に整列して返す。副作用: なし。前提: newTag は有効な TagDefinitionModel である。 */
export function addTopLevelTagDefinition(
  tags: TagDefinitionModel[],
  newTag: TagDefinitionModel
): TagDefinitionModel[] {
  return sortTagDefinitionsRecursiveById([...cloneTags(tags), cloneTags([newTag])[0]])
}

/** 目的: 指定タグを一つ上の兄弟位置へ移動する。副作用: なし。前提: path は移動対象タグを指す。 */
export function moveTagDefinitionUp(tags: TagDefinitionModel[], path: TagPath): TagDefinitionModel[] {
  const nextTags = cloneTags(tags)
  const siblings = getSiblingsByPath(nextTags, path)
  const currentIndex = path[path.length - 1]
  if (!siblings || currentIndex <= 0 || currentIndex >= siblings.length) {
    return nextTags
  }
  const temp = siblings[currentIndex - 1]
  siblings[currentIndex - 1] = siblings[currentIndex]
  siblings[currentIndex] = temp
  return nextTags
}

/** 目的: 指定タグを一つ下の兄弟位置へ移動する。副作用: なし。前提: path は移動対象タグを指す。 */
export function moveTagDefinitionDown(tags: TagDefinitionModel[], path: TagPath): TagDefinitionModel[] {
  const nextTags = cloneTags(tags)
  const siblings = getSiblingsByPath(nextTags, path)
  const currentIndex = path[path.length - 1]
  if (!siblings || currentIndex < 0 || currentIndex >= siblings.length - 1) {
    return nextTags
  }
  const temp = siblings[currentIndex + 1]
  siblings[currentIndex + 1] = siblings[currentIndex]
  siblings[currentIndex] = temp
  return nextTags
}

/** 目的: 指定タグを直前兄弟の子タグとしてネストする。副作用: なし。前提: path は先頭以外の兄弟要素を指す。 */
export function indentTagDefinition(tags: TagDefinitionModel[], path: TagPath): TagDefinitionModel[] {
  const nextTags = cloneTags(tags)
  const siblings = getSiblingsByPath(nextTags, path)
  const currentIndex = path[path.length - 1]
  if (!siblings || currentIndex <= 0 || currentIndex >= siblings.length) {
    return nextTags
  }
  const movingTag = siblings.splice(currentIndex, 1)[0]
  const parentCandidate = siblings[currentIndex - 1]
  const childTags = Array.isArray(parentCandidate.tags) ? parentCandidate.tags : []
  parentCandidate.tags = [...childTags, movingTag]
  return nextTags
}

/** 目的: 指定タグを親階層へ戻し、親の直後へ配置する。副作用: なし。前提: path は2階層以上のタグを指す。 */
export function outdentTagDefinition(tags: TagDefinitionModel[], path: TagPath): TagDefinitionModel[] {
  const nextTags = cloneTags(tags)
  if (path.length < 2) {
    return nextTags
  }
  const parentPath = path.slice(0, -1)
  const childIndex = path[path.length - 1]
  const parentSiblings = getSiblingsByPath(nextTags, parentPath)
  const parentIndex = parentPath[parentPath.length - 1]
  if (!parentSiblings || parentIndex < 0 || parentIndex >= parentSiblings.length) {
    return nextTags
  }
  const parentTag = parentSiblings[parentIndex]
  const childTags = Array.isArray(parentTag.tags) ? parentTag.tags : []
  if (childIndex < 0 || childIndex >= childTags.length) {
    return nextTags
  }
  const movingTag = childTags.splice(childIndex, 1)[0]
  parentTag.tags = childTags
  parentSiblings.splice(parentIndex + 1, 0, movingTag)
  return nextTags
}

/** 目的: 指定タグを削除し、子タグをトップレベルへ昇格する。副作用: なし。前提: path は削除対象タグを指す。 */
export function deleteTagDefinitionByPathWithPromote(
  tags: TagDefinitionModel[],
  path: TagPath
): { tags: TagDefinitionModel[]; removed: boolean } {
  const nextTags = cloneTags(tags)
  const siblings = getSiblingsByPath(nextTags, path)
  const currentIndex = path[path.length - 1]
  if (!siblings || currentIndex < 0 || currentIndex >= siblings.length) {
    return { tags: nextTags, removed: false }
  }
  const deletedTag = siblings.splice(currentIndex, 1)[0]
  const children = Array.isArray(deletedTag.tags) ? deletedTag.tags : []
  const mergedTopLevelTags = sortTagDefinitionsRecursiveById([...nextTags, ...children])
  return {
    tags: mergedTopLevelTags,
    removed: true,
  }
}
