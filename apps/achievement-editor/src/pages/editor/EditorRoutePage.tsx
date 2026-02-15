import { type DragEvent, JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Badge } from '../../shared/ui/badge'
import { Button } from '../../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card'
import { Input } from '../../shared/ui/input'
import {
  changeGroupTitleInCategory,
  applyGroupPatchId,
  applyGroupTagIds,
  moveAchievementFromGroupToGroup,
  applySingleAchievementPatchId,
  applySingleAchievementTagIds,
  createGroupInCategory,
  deleteGroupFromCategory,
  getCommonPatchIdInGroup,
  getCommonTagIdsInGroup,
  getUpdatedCategoryIndices,
  moveGroupPositionInCategory,
  moveAchievementFromGroupToUngroup,
  moveAchievementFromUngroupToGroup,
  sortAchievementsBySourceIndex,
} from '../../features/editor/lib/categoryEditorDomain'
import {
  loadEditorStateByRoute,
  saveEditorStateByRouteToBackend,
  saveCategoryToBackend,
} from '../../features/editor/lib/editorDataSource'
import {
  type AchievementCategoryModel,
  type AchievementEditorState,
  type EditAchievementModel,
} from '../../features/editor/model/types'
import { AchievementCreatorPanel } from '../../features/editor/ui/AchievementCreatorPanel'
import { useAppSnackbar } from '../../features/snackbar/context/AppSnackbarContext'
import { type SnackbarColor } from '../../features/snackbar/lib/snackbarModel'

type EditorRoutePageProps = {
  title: string
  description: string
  routeKey: string
}

type AchievementTagDialogState = {
  groupIndex: number
  dataIndex: number
  tagIdsInput: string
}

type AchievementPatchDialogState = {
  groupIndex: number
  dataIndex: number
  patchField: 'patchId' | 'adjustmentPatchId'
  patchIdInput: string
}

type GroupTitleDialogState = {
  groupIndex: number
  groupTitleInput: string
}

type AchievementDragSourceState =
  | {
      source: 'ungroup'
      ungroupIndex: number
    }
  | {
      source: 'group'
      groupIndex: number
      dataIndex: number
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

/** 目的: 編集状態を安全にディープコピーする。副作用: なし。前提: state はJSONシリアライズ可能である。 */
function cloneEditorState(state: AchievementEditorState): AchievementEditorState {
  return JSON.parse(JSON.stringify(state)) as AchievementEditorState
}

/** 目的: 指定カテゴリだけをbaseStateへ反映して保存済み基準を更新する。副作用: なし。前提: index は配列範囲内である。 */
function mergeBaseCategory(
  baseState: AchievementEditorState,
  nextCategory: AchievementCategoryModel,
  index: number
): AchievementEditorState {
  const nextCategories = baseState.achievementCategories.map((category, categoryIndex) =>
    categoryIndex === index ? nextCategory : category
  )
  return {
    ...baseState,
    achievementCategories: nextCategories,
  }
}

/** 目的: 旧VueのitemsEditor責務を段階移行するReact編集画面を提供する。副作用: Cloud Storage読込とsave_text保存を実行する。前提: routeKey/title がルート責務と一致する。 */
export function EditorRoutePage({ title, description, routeKey }: EditorRoutePageProps): JSX.Element {
  const backendBaseUrl =
    (import.meta.env.VITE_ACHIEVEMENT_BACKEND_BASE_URL as string | undefined) ?? ''
  const { showSnackbar } = useAppSnackbar()
  const [editorState, setEditorState] = useState<AchievementEditorState | null>(null)
  const [baseState, setBaseState] = useState<AchievementEditorState | null>(null)
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0)
  const [newGroupTitle, setNewGroupTitle] = useState<string>('')
  const [groupTitleDialogState, setGroupTitleDialogState] = useState<GroupTitleDialogState | null>(null)
  const [tagDialogState, setTagDialogState] = useState<AchievementTagDialogState | null>(null)
  const [patchDialogState, setPatchDialogState] = useState<AchievementPatchDialogState | null>(null)
  const [achievementDragSource, setAchievementDragSource] = useState<AchievementDragSourceState | null>(
    null
  )
  const [groupDragSourceIndex, setGroupDragSourceIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  /** 目的: 共通スナックバーへメッセージを通知する。副作用: 全画面通知レイヤーを表示する。前提: Provider配下で実行される。 */
  const setMessage = useCallback((text: string, color: SnackbarColor = 'primary'): void => {
    showSnackbar({ text, color })
  }, [showSnackbar])

  useEffect(() => {
    let cancelled = false
    const cloudStorageBaseUrl =
      (import.meta.env.VITE_ACHIEVEMENT_DATA_BASE_URL as string | undefined) ??
      undefined

    /** 目的: ルート単位のカテゴリ編集データを読み込み、表示状態を初期化する。副作用: state更新を行う。前提: routeKey は既存ルートキーである。 */
    const loadData = async (): Promise<void> => {
      setIsLoading(true)
      setErrorMessage('')
      setActiveCategoryIndex(0)
      setNewGroupTitle('')
      setGroupTitleDialogState(null)
      setTagDialogState(null)
      setPatchDialogState(null)
      setAchievementDragSource(null)
      setGroupDragSourceIndex(null)
      try {
        const loadedState = await loadEditorStateByRoute(routeKey, title, {
          cloudStorageBaseUrl,
        })
        if (cancelled) {
          return
        }
        setEditorState(loadedState)
        setBaseState(cloneEditorState(loadedState))
      } catch (error) {
        if (cancelled) {
          return
        }
        const reason = error instanceof Error ? error.message : String(error)
        setEditorState(null)
        setBaseState(null)
        setErrorMessage(`編集データの取得に失敗しました: ${reason}`)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [routeKey, title])

  const currentCategory = useMemo((): AchievementCategoryModel | null => {
    if (!editorState) {
      return null
    }
    return editorState.achievementCategories[activeCategoryIndex] ?? null
  }, [editorState, activeCategoryIndex])

  const updatedCategoryIndices = useMemo((): number[] => {
    if (!editorState || !baseState) {
      return []
    }
    return getUpdatedCategoryIndices(baseState, editorState)
  }, [baseState, editorState])

  const isUpdatedCurrentCategory = updatedCategoryIndices.includes(activeCategoryIndex)
  const isUpdatedAnyCategory = updatedCategoryIndices.length > 0

  /** 目的: 表示中カテゴリを更新する。副作用: editorStateを更新する。前提: currentCategoryが存在する。 */
  const updateCurrentCategory = (
    updater: (category: AchievementCategoryModel) => AchievementCategoryModel
  ): void => {
    if (!editorState || !currentCategory) {
      return
    }
    const nextCategories = editorState.achievementCategories.map((category, index) =>
      index === activeCategoryIndex ? updater(category) : category
    )
    setEditorState({
      ...editorState,
      achievementCategories: nextCategories,
    })
  }

  /** 目的: 新規グループを作成する。副作用: editorState と通知メッセージを更新する。前提: グループ名は空文字・重複不可である。 */
  const handleCreateGroup = (): void => {
    if (!currentCategory) {
      return
    }
    const result = createGroupInCategory(currentCategory, newGroupTitle)
    if (!result.ok) {
      setMessage(
        result.errorCode === 'group_title_required'
          ? 'グループ名は必須です。'
          : `「${newGroupTitle.trim()}」は既に存在します。`,
        'warning'
      )
      return
    }
    updateCurrentCategory(() => result.category)
    setNewGroupTitle('')
    setMessage(`グループ「${result.category.group[result.category.group.length - 1].title}」を作成しました。`)
  }

  /** 目的: 指定グループを削除し子要素を未分類へ戻す。副作用: editorState と通知メッセージを更新する。前提: groupIndex は表示中グループの有効範囲である。 */
  const handleDeleteGroup = (groupIndex: number): void => {
    updateCurrentCategory((category) => deleteGroupFromCategory(category, groupIndex))
    setMessage('グループを削除し、所属アチーブメントを未分類へ戻しました。')
  }

  /** 目的: グループ名編集ダイアログを開く。副作用: ダイアログstateを更新する。前提: groupIndex は表示中グループの有効範囲である。 */
  const openGroupTitleDialog = (groupIndex: number): void => {
    const targetGroup = currentCategory?.group[groupIndex]
    if (!targetGroup) {
      return
    }
    setGroupTitleDialogState({
      groupIndex,
      groupTitleInput: targetGroup.title,
    })
  }

  /** 目的: グループ名編集ダイアログの入力値を更新する。副作用: ダイアログstateを更新する。前提: ダイアログが開いている。 */
  const updateGroupTitleDialogInput = (groupTitleInput: string): void => {
    setGroupTitleDialogState((currentState) => {
      if (!currentState) {
        return null
      }
      return {
        ...currentState,
        groupTitleInput,
      }
    })
  }

  /** 目的: グループ名編集ダイアログの入力値をカテゴリへ反映する。副作用: editorState更新と通知を行い、ダイアログを閉じる。前提: 入力値は空文字不可・同名重複不可。 */
  const applyGroupTitleDialog = (): void => {
    if (!currentCategory || !groupTitleDialogState) {
      return
    }

    const result = changeGroupTitleInCategory(
      currentCategory,
      groupTitleDialogState.groupIndex,
      groupTitleDialogState.groupTitleInput
    )
    if (!result.ok) {
      if (result.errorCode === 'group_title_required') {
        setMessage('グループ名は必須です。', 'warning')
        return
      }
      if (result.errorCode === 'group_already_exists') {
        setMessage('同名のグループが既に存在します。', 'warning')
        return
      }
      setMessage('グループ名の更新対象が見つかりませんでした。', 'error')
      setGroupTitleDialogState(null)
      return
    }

    updateCurrentCategory(() => result.category)
    setGroupTitleDialogState(null)
    setMessage('グループ名を更新しました。')
  }

  /** 目的: 未分類アチーブメントをグループへ移動する。副作用: editorState を更新する。前提: groupIndex は存在するグループを指す。 */
  const handleMoveUngroupToGroup = (ungroupIndex: number, groupIndex: number): void => {
    updateCurrentCategory((category) =>
      moveAchievementFromUngroupToGroup(category, ungroupIndex, groupIndex)
    )
    setMessage('未分類アチーブメントをグループへ移動しました。')
  }

  /** 目的: グループ所属アチーブメントを未分類へ戻す。副作用: editorState を更新する。前提: groupIndex/dataIndex は有効範囲である。 */
  const handleMoveGroupToUngroup = (groupIndex: number, dataIndex: number): void => {
    updateCurrentCategory((category) =>
      moveAchievementFromGroupToUngroup(category, groupIndex, dataIndex)
    )
    setMessage('グループ所属アチーブメントを未分類へ戻しました。')
  }

  /** 目的: アチーブメントのドラッグ開始状態を設定する。副作用: Dragイベントへ識別情報を設定し、stateを更新する。前提: indexは対象配列の有効範囲である。 */
  const startAchievementDragFromUngroup = (
    event: DragEvent<HTMLElement>,
    ungroupIndex: number
  ): void => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `ungroup:${ungroupIndex}`)
    setAchievementDragSource({
      source: 'ungroup',
      ungroupIndex,
    })
  }

  /** 目的: グループ内アチーブメントのドラッグ開始状態を設定する。副作用: Dragイベントへ識別情報を設定し、stateを更新する。前提: groupIndex/dataIndex は有効範囲である。 */
  const startAchievementDragFromGroup = (
    event: DragEvent<HTMLElement>,
    groupIndex: number,
    dataIndex: number
  ): void => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `group:${groupIndex}:${dataIndex}`)
    setAchievementDragSource({
      source: 'group',
      groupIndex,
      dataIndex,
    })
  }

  /** 目的: アチーブメントD&Dのドラッグ状態を解除する。副作用: drag source stateを初期化する。前提: なし。 */
  const clearAchievementDragSource = (): void => {
    setAchievementDragSource(null)
  }

  /** 目的: Drop許可のためdragoverを受理する。副作用: ブラウザ既定動作を抑止する。前提: なし。 */
  const allowDrop = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault()
  }

  /** 目的: 未分類領域へのDropでアチーブメントを移動する。副作用: editorState更新と通知を行う。前提: drag source はアチーブメントである。 */
  const dropAchievementToUngroup = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault()
    if (!achievementDragSource) {
      return
    }
    if (achievementDragSource.source === 'ungroup') {
      return
    }
    updateCurrentCategory((category) =>
      moveAchievementFromGroupToUngroup(
        category,
        achievementDragSource.groupIndex,
        achievementDragSource.dataIndex
      )
    )
    clearAchievementDragSource()
    setMessage('ドラッグ&ドロップで未分類へ移動しました。')
  }

  /** 目的: 指定グループ領域へのDropでアチーブメントを移動する。副作用: editorState更新と通知を行う。前提: targetGroupIndex は有効範囲である。 */
  const dropAchievementToGroup = (
    event: DragEvent<HTMLElement>,
    targetGroupIndex: number
  ): void => {
    event.preventDefault()
    if (!achievementDragSource) {
      return
    }
    if (achievementDragSource.source === 'ungroup') {
      updateCurrentCategory((category) =>
        moveAchievementFromUngroupToGroup(category, achievementDragSource.ungroupIndex, targetGroupIndex)
      )
      clearAchievementDragSource()
      setMessage('ドラッグ&ドロップでグループへ移動しました。')
      return
    }

    if (achievementDragSource.groupIndex === targetGroupIndex) {
      return
    }

    updateCurrentCategory((category) =>
      moveAchievementFromGroupToGroup(
        category,
        achievementDragSource.groupIndex,
        achievementDragSource.dataIndex,
        targetGroupIndex
      )
    )
    clearAchievementDragSource()
    setMessage('ドラッグ&ドロップで別グループへ移動しました。')
  }

  /** 目的: グループ並び替え用のドラッグ開始状態を設定する。副作用: Dragイベントへ識別情報を設定し、stateを更新する。前提: groupIndex は有効範囲である。 */
  const startGroupDrag = (event: DragEvent<HTMLElement>, groupIndex: number): void => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `group-order:${groupIndex}`)
    setGroupDragSourceIndex(groupIndex)
  }

  /** 目的: 指定位置へグループ順を移動する。副作用: editorState更新と通知を行う。前提: drag source/target は有効範囲である。 */
  const dropGroupToPosition = (
    event: DragEvent<HTMLElement>,
    targetGroupIndex: number
  ): void => {
    event.preventDefault()
    if (groupDragSourceIndex === null || groupDragSourceIndex === targetGroupIndex) {
      return
    }
    updateCurrentCategory((category) =>
      moveGroupPositionInCategory(category, groupDragSourceIndex, targetGroupIndex)
    )
    setGroupDragSourceIndex(null)
    setMessage('グループ順を更新しました。')
  }

  /** 目的: グループ並び替えのドラッグ状態を解除する。副作用: drag source index を初期化する。前提: なし。 */
  const clearGroupDragSource = (): void => {
    setGroupDragSourceIndex(null)
  }

  /** 目的: グループ領域へのDropを種別判定して適切な処理へ委譲する。副作用: 並び替えまたはアチーブメント移動を実行する。前提: targetGroupIndex は有効範囲である。 */
  const handleDropOnGroupContainer = (
    event: DragEvent<HTMLElement>,
    targetGroupIndex: number
  ): void => {
    if (groupDragSourceIndex !== null) {
      dropGroupToPosition(event, targetGroupIndex)
      return
    }
    dropAchievementToGroup(event, targetGroupIndex)
  }

  /** 目的: グループ共通タグ編集を適用する。副作用: editorState を更新する。前提: CSV入力は parseTagIdsInput で正規化する。 */
  const handleApplyGroupTags = (groupIndex: number, rawText: string): void => {
    const nextTagIds = parseTagIdsInput(rawText)
    updateCurrentCategory((category) => applyGroupTagIds(category, groupIndex, nextTagIds))
    setMessage('グループ共通タグを更新しました。')
  }

  /** 目的: グループ共通パッチIDを適用する。副作用: editorState を更新する。前提: patchId は 0 以上の整数を受け取る。 */
  const handleApplyGroupPatch = (groupIndex: number, patchId: number): void => {
    const normalizedPatchId = Number.isInteger(patchId) && patchId >= 0 ? patchId : 0
    updateCurrentCategory((category) =>
      applyGroupPatchId(category, groupIndex, 'patchId', normalizedPatchId)
    )
    setMessage('対応パッチIDを更新しました。')
  }

  /** 目的: グループ共通緩和パッチIDを適用する。副作用: editorState を更新する。前提: patchId は 0 以上の整数を受け取る。 */
  const handleApplyGroupAdjustmentPatch = (groupIndex: number, patchId: number): void => {
    const normalizedPatchId = Number.isInteger(patchId) && patchId >= 0 ? patchId : 0
    updateCurrentCategory((category) =>
      applyGroupPatchId(category, groupIndex, 'adjustmentPatchId', normalizedPatchId)
    )
    setMessage('緩和パッチIDを更新しました。')
  }

  /** 目的: 表示中カテゴリを backend の save_text API へ保存する。副作用: HTTP POST を実行し、成功時にbaseStateを更新する。前提: 認証セッションが有効である。 */
  const handleSaveCategory = async (): Promise<void> => {
    if (!editorState || !baseState || !currentCategory) {
      return
    }

    try {
      await saveCategoryToBackend(editorState.key, currentCategory, {
        backendBaseUrl,
      })
      const nextBaseState = mergeBaseCategory(
        baseState,
        cloneEditorState({
          ...editorState,
          achievementCategories: [currentCategory],
        }).achievementCategories[0],
        activeCategoryIndex
      )
      setBaseState(nextBaseState)
      setMessage(`カテゴリ「${currentCategory.path}」を保存しました。`)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setMessage(`保存に失敗しました: ${reason}`, 'error')
    }
  }

  /** 目的: ルート内の全カテゴリを backend の save_text API へ一括保存する。副作用: 複数HTTP POSTを実行し、成功時にbaseState全体を更新する。前提: 認証セッションが有効である。 */
  const handleSaveCategoryTable = async (): Promise<void> => {
    if (!editorState || !baseState) {
      return
    }

    try {
      await saveEditorStateByRouteToBackend(editorState, {
        backendBaseUrl,
      })
      setBaseState(cloneEditorState(editorState))
      setMessage(`${editorState.kindName} を全カテゴリ保存しました。`)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setMessage(`全体保存に失敗しました: ${reason}`, 'error')
    }
  }

  /** 目的: アチーブメント個別タグ編集ダイアログを開く。副作用: ダイアログstateを更新する。前提: group/data index が有効範囲である。 */
  const openAchievementTagDialog = (groupIndex: number, dataIndex: number): void => {
    const targetAchievement = currentCategory?.group[groupIndex]?.data[dataIndex]
    if (!targetAchievement) {
      return
    }
    setTagDialogState({
      groupIndex,
      dataIndex,
      tagIdsInput: formatTagIds(targetAchievement.tagIds),
    })
  }

  /** 目的: 個別タグ編集ダイアログの入力値を更新する。副作用: ダイアログstateを更新する。前提: ダイアログが開いている。 */
  const updateTagDialogInput = (tagIdsInput: string): void => {
    setTagDialogState((currentState) => {
      if (!currentState) {
        return null
      }
      return {
        ...currentState,
        tagIdsInput,
      }
    })
  }

  /** 目的: 個別タグ編集結果を対象アチーブメントへ適用する。副作用: editorStateを更新し、ダイアログを閉じる。前提: ダイアログstateが有効である。 */
  const applyAchievementTagDialog = (): void => {
    if (!tagDialogState) {
      return
    }
    const parsedTagIds = parseTagIdsInput(tagDialogState.tagIdsInput)
    updateCurrentCategory((category) =>
      applySingleAchievementTagIds(
        category,
        tagDialogState.groupIndex,
        tagDialogState.dataIndex,
        parsedTagIds
      )
    )
    setTagDialogState(null)
    setMessage('アチーブメント個別タグを更新しました。')
  }

  /** 目的: アチーブメント個別パッチ編集ダイアログを開く。副作用: ダイアログstateを更新する。前提: group/data index が有効範囲である。 */
  const openAchievementPatchDialog = (
    groupIndex: number,
    dataIndex: number,
    patchField: 'patchId' | 'adjustmentPatchId'
  ): void => {
    const targetAchievement = currentCategory?.group[groupIndex]?.data[dataIndex]
    if (!targetAchievement) {
      return
    }
    setPatchDialogState({
      groupIndex,
      dataIndex,
      patchField,
      patchIdInput: String(targetAchievement[patchField]),
    })
  }

  /** 目的: 個別パッチ編集ダイアログの入力値を更新する。副作用: ダイアログstateを更新する。前提: ダイアログが開いている。 */
  const updatePatchDialogInput = (patchIdInput: string): void => {
    setPatchDialogState((currentState) => {
      if (!currentState) {
        return null
      }
      return {
        ...currentState,
        patchIdInput,
      }
    })
  }

  /** 目的: 個別パッチ編集結果を対象アチーブメントへ適用する。副作用: editorStateを更新し、ダイアログを閉じる。前提: ダイアログstateが有効である。 */
  const applyAchievementPatchDialog = (): void => {
    if (!patchDialogState) {
      return
    }
    const parsedPatchId = Number(patchDialogState.patchIdInput)
    updateCurrentCategory((category) =>
      applySingleAchievementPatchId(
        category,
        patchDialogState.groupIndex,
        patchDialogState.dataIndex,
        patchDialogState.patchField,
        parsedPatchId
      )
    )
    setPatchDialogState(null)
    setMessage(
      patchDialogState.patchField === 'patchId'
        ? 'アチーブメント個別の対応パッチIDを更新しました。'
        : 'アチーブメント個別の緩和パッチIDを更新しました。'
    )
  }

  /** 目的: AchievementCreatorで生成・取得したアチーブメントを未分類へ追加する。副作用: editorState更新と通知を行う。前提: currentCategoryが存在する。 */
  const handleAchievementCreated = (achievement: EditAchievementModel): void => {
    updateCurrentCategory((category) => ({
      ...category,
      ungroup: sortAchievementsBySourceIndex([...category.ungroup, achievement]),
    }))
  }

  /** 目的: 子コンポーネントからの通知メッセージを共通スナックバーへ反映する。副作用: 全画面通知レイヤーを表示する。前提: messageは表示可能文字列である。 */
  const handleCreatorMessage = (nextMessage: string): void => {
    setMessage(nextMessage, nextMessage.includes('エラー') ? 'error' : 'primary')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Cloud Storage から編集データを読み込んでいます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (errorMessage !== '') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-[var(--danger)]">{errorMessage}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!editorState || !currentCategory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            このルートはカテゴリ編集データが未接続です。`tag/patch` は別画面として継続移植します。
          </CardDescription>
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
            {isUpdatedCurrentCategory ? (
              <Badge variant="subtle">未保存差分あり</Badge>
            ) : (
              <Badge variant="subtle">保存済み</Badge>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {editorState.achievementCategories.map((category, index) => (
              <Button
                key={category.path}
                type="button"
                variant={index === activeCategoryIndex ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategoryIndex(index)}
              >
                {category.path}
              </Button>
            ))}
          </div>
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleSaveCategoryTable()}
              disabled={!isUpdatedAnyCategory}
            >
              テーブル全体保存（save_text）
            </Button>
            <Button type="button" onClick={() => void handleSaveCategory()} disabled={!isUpdatedCurrentCategory}>
              カテゴリ保存（save_text）
            </Button>
          </div>
        </CardContent>
      </Card>

      <AchievementCreatorPanel
        categoryKey={editorState.key}
        group={currentCategory.path}
        backendBaseUrl={backendBaseUrl}
        onCreated={handleAchievementCreated}
        onMessage={handleCreatorMessage}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">未分類 ({currentCategory.ungroup.length})</CardTitle>
            <CardDescription>旧itemsEditorの ungroup 領域に相当します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2" onDragOver={allowDrop} onDrop={dropAchievementToUngroup}>
            {currentCategory.ungroup.map((achievement, ungroupIndex) => (
              <div
                key={achievement.id}
                className="rounded-xl border border-[var(--line)] bg-white p-3"
                draggable
                onDragStart={(event) => startAchievementDragFromUngroup(event, ungroupIndex)}
                onDragEnd={clearAchievementDragSource}
              >
                <p className="font-semibold">{achievement.title}</p>
                <p className="text-xs text-[var(--ink-subtle)]">sourceIndex: {achievement.sourceIndex}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentCategory.group.map((group, groupIndex) => (
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
            <CardTitle className="text-xl">分類済みグループ ({currentCategory.group.length})</CardTitle>
            <CardDescription>タグ/パッチ共通値の一括編集を提供します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentCategory.group.map((group, groupIndex) => {
              const commonTagIds = getCommonTagIdsInGroup(currentCategory, groupIndex)
              const commonPatchId = getCommonPatchIdInGroup(currentCategory, groupIndex, 'patchId')
              const commonAdjustmentPatchId = getCommonPatchIdInGroup(
                currentCategory,
                groupIndex,
                'adjustmentPatchId'
              )

              return (
                <div
                  key={`${group.title}-${groupIndex}`}
                  className="rounded-xl border border-[var(--line)] bg-white p-3"
                  onDragOver={allowDrop}
                  onDrop={(event) => handleDropOnGroupContainer(event, groupIndex)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{group.title}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        draggable
                        onDragStart={(event) => startGroupDrag(event, groupIndex)}
                        onDragEnd={clearGroupDragSource}
                      >
                        並び替え
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => openGroupTitleDialog(groupIndex)}>
                        グループ名編集
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteGroup(groupIndex)}>
                        グループ削除
                      </Button>
                    </div>
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
                        onBlur={(event) => handleApplyGroupPatch(groupIndex, Number(event.currentTarget.value))}
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
                        draggable
                        onDragStart={(event) => startAchievementDragFromGroup(event, groupIndex, dataIndex)}
                        onDragEnd={clearAchievementDragSource}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{achievement.title}</p>
                          <div className="flex flex-wrap items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openAchievementTagDialog(groupIndex, dataIndex)}
                            >
                              タグ編集
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openAchievementPatchDialog(groupIndex, dataIndex, 'patchId')}
                            >
                              対応Patch
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openAchievementPatchDialog(groupIndex, dataIndex, 'adjustmentPatchId')
                              }
                            >
                              緩和Patch
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveGroupToUngroup(groupIndex, dataIndex)}
                            >
                              未分類へ戻す
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--ink-subtle)]">
                          sourceIndex: {achievement.sourceIndex} / tagIds: {formatTagIds(achievement.tagIds)} / patch:{' '}
                          {achievement.patchId} / adjustment: {achievement.adjustmentPatchId}
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

      <Dialog
        open={groupTitleDialogState !== null}
        onClose={() => setGroupTitleDialogState(null)}
        className="relative z-[80]"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl border border-[var(--line)] bg-white p-4 shadow-xl">
            <Dialog.Title className="text-base font-semibold">グループ名編集</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-[var(--ink-subtle)]">
              既存グループと重複しない名称を入力してください。
            </Dialog.Description>
            <div className="mt-3 space-y-3">
              <Input
                value={groupTitleDialogState?.groupTitleInput ?? ''}
                onChange={(event) => updateGroupTitleDialogInput(event.currentTarget.value)}
                placeholder="グループ名"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setGroupTitleDialogState(null)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={applyGroupTitleDialog}>
                  決定
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={tagDialogState !== null} onClose={() => setTagDialogState(null)} className="relative z-[80]">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl border border-[var(--line)] bg-white p-4 shadow-xl">
            <Dialog.Title className="text-base font-semibold">アチーブメント個別タグ編集</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-[var(--ink-subtle)]">
              カンマ区切りでタグIDを指定してください。
            </Dialog.Description>
            <div className="mt-3 space-y-3">
              <Input
                value={tagDialogState?.tagIdsInput ?? ''}
                onChange={(event) => updateTagDialogInput(event.currentTarget.value)}
                placeholder="例: 1,2,10"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setTagDialogState(null)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={applyAchievementTagDialog}>
                  決定
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={patchDialogState !== null} onClose={() => setPatchDialogState(null)} className="relative z-[80]">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl border border-[var(--line)] bg-white p-4 shadow-xl">
            <Dialog.Title className="text-base font-semibold">
              {patchDialogState?.patchField === 'patchId'
                ? 'アチーブメント個別の対応パッチID編集'
                : 'アチーブメント個別の緩和パッチID編集'}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-[var(--ink-subtle)]">
              0 以上の整数を指定してください。
            </Dialog.Description>
            <div className="mt-3 space-y-3">
              <Input
                type="number"
                value={patchDialogState?.patchIdInput ?? '0'}
                onChange={(event) => updatePatchDialogInput(event.currentTarget.value)}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setPatchDialogState(null)}>
                  キャンセル
                </Button>
                <Button type="button" onClick={applyAchievementPatchDialog}>
                  決定
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </section>
  )
}
