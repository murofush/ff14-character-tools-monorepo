import { JSX, useEffect, useMemo, useState } from 'react'
import { Badge } from '../../shared/ui/badge'
import { Button } from '../../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card'
import { Input } from '../../shared/ui/input'
import {
  applyGroupPatchId,
  applyGroupTagIds,
  createGroupInCategory,
  deleteGroupFromCategory,
  getCommonPatchIdInGroup,
  getCommonTagIdsInGroup,
  getUpdatedCategoryIndices,
  moveAchievementFromGroupToUngroup,
  moveAchievementFromUngroupToGroup,
} from '../../features/editor/lib/categoryEditorDomain'
import { cloneEditorState, createInitialEditorState } from '../../features/editor/lib/sampleEditorData'
import { type AchievementCategoryModel } from '../../features/editor/model/types'

type EditorRoutePageProps = {
  title: string
  description: string
  routeKey: string
}

/** 目的: タグID入力欄（CSV）を配列へ変換する。副作用: なし。前提: 入力値は数値またはカンマ区切り文字列である。 */
function parseTagIdsInput(rawText: string): number[] {
  const values = rawText
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value !== '')
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0)
  return Array.from(new Set(values)).sort((a, b) => a - b)
}

/** 目的: タグID配列を入力欄表示用のCSV文字列へ変換する。副作用: なし。前提: tagIds は整数配列である。 */
function formatTagIds(tagIds: number[]): string {
  return tagIds.join(',')
}

/** 目的: 旧VueのitemsEditor責務を段階移行するReact編集画面を提供する。副作用: ローカルstateの更新を行う。前提: routeKey/title がルート責務と一致する。 */
export function EditorRoutePage({ title, description, routeKey }: EditorRoutePageProps): JSX.Element {
  const [editorState, setEditorState] = useState(() => createInitialEditorState(routeKey, title))
  const [baseState, setBaseState] = useState(() => cloneEditorState(createInitialEditorState(routeKey, title)))
  const [newGroupTitle, setNewGroupTitle] = useState<string>('')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const initialState = createInitialEditorState(routeKey, title)
    setEditorState(initialState)
    setBaseState(cloneEditorState(initialState))
    setNewGroupTitle('')
    setMessage('')
  }, [routeKey, title])

  const category = editorState.achievementCategories[0]
  const updatedIndices = useMemo(
    () => getUpdatedCategoryIndices(baseState, editorState),
    [baseState, editorState]
  )
  const isUpdated = updatedIndices.includes(0)

  /** 目的: 現在表示カテゴリを更新する共通処理を提供する。副作用: editorState を更新する。前提: 単一カテゴリ編集で index=0 を対象とする。 */
  const updateCategory = (updater: (current: AchievementCategoryModel) => AchievementCategoryModel): void => {
    setEditorState((current) => {
      const targetCategory = current.achievementCategories[0]
      if (!targetCategory) {
        return current
      }
      return {
        ...current,
        achievementCategories: [updater(targetCategory)],
      }
    })
  }

  /** 目的: 新規グループを作成する。副作用: editorState と通知メッセージを更新する。前提: グループ名は空文字・重複不可である。 */
  const handleCreateGroup = (): void => {
    if (!category) {
      return
    }
    const result = createGroupInCategory(category, newGroupTitle)
    if (!result.ok) {
      setMessage(
        result.errorCode === 'group_title_required'
          ? 'グループ名は必須です。'
          : `「${newGroupTitle.trim()}」は既に存在します。`
      )
      return
    }
    updateCategory(() => result.category)
    setNewGroupTitle('')
    setMessage(`グループ「${result.category.group[result.category.group.length - 1].title}」を作成しました。`)
  }

  /** 目的: 指定グループを削除し子要素を未分類へ戻す。副作用: editorState と通知メッセージを更新する。前提: groupIndex は表示中グループの有効範囲である。 */
  const handleDeleteGroup = (groupIndex: number): void => {
    updateCategory((currentCategory) => deleteGroupFromCategory(currentCategory, groupIndex))
    setMessage('グループを削除し、所属アチーブメントを未分類へ戻しました。')
  }

  /** 目的: 未分類アチーブメントをグループへ移動する。副作用: editorState を更新する。前提: groupIndex は存在するグループを指す。 */
  const handleMoveUngroupToGroup = (ungroupIndex: number, groupIndex: number): void => {
    updateCategory((currentCategory) =>
      moveAchievementFromUngroupToGroup(currentCategory, ungroupIndex, groupIndex)
    )
    setMessage('未分類アチーブメントをグループへ移動しました。')
  }

  /** 目的: グループ所属アチーブメントを未分類へ戻す。副作用: editorState を更新する。前提: groupIndex/dataIndex は有効範囲である。 */
  const handleMoveGroupToUngroup = (groupIndex: number, dataIndex: number): void => {
    updateCategory((currentCategory) =>
      moveAchievementFromGroupToUngroup(currentCategory, groupIndex, dataIndex)
    )
    setMessage('グループ所属アチーブメントを未分類へ戻しました。')
  }

  /** 目的: グループ共通タグ編集を適用する。副作用: editorState を更新する。前提: CSV入力は parseTagIdsInput で正規化する。 */
  const handleApplyGroupTags = (groupIndex: number, rawText: string): void => {
    const nextTagIds = parseTagIdsInput(rawText)
    updateCategory((currentCategory) => applyGroupTagIds(currentCategory, groupIndex, nextTagIds))
    setMessage('グループ共通タグを更新しました。')
  }

  /** 目的: グループ共通パッチIDを適用する。副作用: editorState を更新する。前提: patchId は 0 以上の整数を受け取る。 */
  const handleApplyGroupPatch = (groupIndex: number, patchId: number): void => {
    const normalizedPatchId = Number.isInteger(patchId) && patchId >= 0 ? patchId : 0
    updateCategory((currentCategory) =>
      applyGroupPatchId(currentCategory, groupIndex, 'patchId', normalizedPatchId)
    )
    setMessage('対応パッチIDを更新しました。')
  }

  /** 目的: グループ共通緩和パッチIDを適用する。副作用: editorState を更新する。前提: patchId は 0 以上の整数を受け取る。 */
  const handleApplyGroupAdjustmentPatch = (groupIndex: number, patchId: number): void => {
    const normalizedPatchId = Number.isInteger(patchId) && patchId >= 0 ? patchId : 0
    updateCategory((currentCategory) =>
      applyGroupPatchId(currentCategory, groupIndex, 'adjustmentPatchId', normalizedPatchId)
    )
    setMessage('緩和パッチIDを更新しました。')
  }

  /** 目的: 現在カテゴリを保存済み基準へ反映し差分状態を解消する。副作用: baseState を更新する。前提: 実API保存は未接続のためローカル保存のみ行う。 */
  const handleSaveCategory = (): void => {
    setBaseState(cloneEditorState(editorState))
    setMessage('カテゴリ差分を保存済みとして確定しました。（ローカル）')
  }

  if (!category) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>カテゴリデータが見つかりませんでした。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge>{routeKey}</Badge>
            {isUpdated ? <Badge variant="subtle">未保存差分あり</Badge> : <Badge variant="subtle">保存済み</Badge>}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input
              value={newGroupTitle}
              onChange={(event) => setNewGroupTitle(event.currentTarget.value)}
              placeholder="新規グループ名"
            />
            <Button type="button" variant="secondary" onClick={handleCreateGroup}>
              グループ作成
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" onClick={handleSaveCategory} disabled={!isUpdated}>
              カテゴリ保存（ローカル）
            </Button>
          </div>
          {message !== '' ? (
            <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--ink-subtle)]">
              {message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">未分類 ({category.ungroup.length})</CardTitle>
            <CardDescription>旧itemsEditorの ungroup 領域に相当します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {category.ungroup.map((achievement, ungroupIndex) => (
              <div
                key={achievement.id}
                className="rounded-xl border border-[var(--line)] bg-white p-3"
              >
                <p className="font-semibold">{achievement.title}</p>
                <p className="text-xs text-[var(--ink-subtle)]">
                  sourceIndex: {achievement.sourceIndex}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {category.group.map((group, groupIndex) => (
                    <Button
                      key={`${achievement.id}-${group.title}`}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUngroupToGroup(ungroupIndex, groupIndex)}
                    >
                      → {group.title}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">分類済みグループ ({category.group.length})</CardTitle>
            <CardDescription>タグ/パッチ共通値の一括編集を提供します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {category.group.map((group, groupIndex) => {
              const commonTagIds = getCommonTagIdsInGroup(category, groupIndex)
              const commonPatchId = getCommonPatchIdInGroup(category, groupIndex, 'patchId')
              const commonAdjustmentPatchId = getCommonPatchIdInGroup(
                category,
                groupIndex,
                'adjustmentPatchId'
              )

              return (
                <div key={`${group.title}-${groupIndex}`} className="rounded-xl border border-[var(--line)] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{group.title}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(groupIndex)}
                    >
                      グループ削除
                    </Button>
                  </div>
                  <div className="mt-2 grid gap-2">
                    <label className="text-xs text-[var(--ink-subtle)]">
                      共通タグID（CSV）
                      <Input
                        defaultValue={formatTagIds(commonTagIds)}
                        onBlur={(event) => handleApplyGroupTags(groupIndex, event.currentTarget.value)}
                      />
                    </label>
                    <label className="text-xs text-[var(--ink-subtle)]">
                      対応パッチID
                      <Input
                        type="number"
                        defaultValue={String(commonPatchId)}
                        onBlur={(event) =>
                          handleApplyGroupPatch(groupIndex, Number(event.currentTarget.value))
                        }
                      />
                    </label>
                    <label className="text-xs text-[var(--ink-subtle)]">
                      緩和パッチID
                      <Input
                        type="number"
                        defaultValue={String(commonAdjustmentPatchId)}
                        onBlur={(event) =>
                          handleApplyGroupAdjustmentPatch(groupIndex, Number(event.currentTarget.value))
                        }
                      />
                    </label>
                  </div>
                  <div className="mt-3 space-y-2">
                    {group.data.map((achievement, dataIndex) => (
                      <div
                        key={achievement.id}
                        className="rounded-lg border border-[var(--line)] bg-[var(--surface-alt)] px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{achievement.title}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveGroupToUngroup(groupIndex, dataIndex)}
                          >
                            未分類へ戻す
                          </Button>
                        </div>
                        <p className="text-xs text-[var(--ink-subtle)]">
                          sourceIndex: {achievement.sourceIndex} / tagIds: {formatTagIds(achievement.tagIds)} /
                          patch: {achievement.patchId} / adjustment: {achievement.adjustmentPatchId}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
