import { Dialog, Menu } from '@headlessui/react'
import { EllipsisVertical, List, X } from 'lucide-react'
import { JSX, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearSelectedAchievementPaths,
  readCharacterSessionResponse,
  readSelectedAchievementPaths,
  writeSelectedAchievementPaths,
} from '../../features/select-achievement/lib/characterSessionStorage'
import {
  buildCompletedAchievementTitleMap,
  getAchievementKindDefinitions,
  loadAchievementCategoryByPath,
} from '../../features/select-achievement/lib/selectAchievementDataSource'
import {
  findAchievementSelectionIndex,
  removeAchievementSelectionByPath,
  selectionErrorToMessage,
  toggleAchievementSelection,
} from '../../features/select-achievement/lib/selectAchievementDomain'
import { type AchievementIndexPath, type SelectableAchievement, type SelectableAchievementCategory } from '../../features/select-achievement/model/types'
import { useAppSnackbar } from '../../features/snackbar/context/AppSnackbarContext'
import { Badge } from '../../shared/ui/badge'
import { Button } from '../../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card'

const MAX_ACHIEVEMENT_COUNT = 4
const CLOSE_SELECTED_PANEL_HEIGHT = 52
const OPEN_SELECTED_PANEL_HEIGHT = 224

type CategoryCacheState =
  | {
      status: 'idle'
    }
  | {
      status: 'loading'
    }
  | {
      status: 'ready'
      data: SelectableAchievementCategory
    }
  | {
      status: 'error'
      errorMessage: string
    }

type CategoryCacheRecord = Record<string, CategoryCacheState>

/** 目的: kind/categoryの組み合わせをカテゴリキャッシュキーへ変換する。副作用: なし。前提: kindKeyとcategoryIdは空文字でない。 */
function buildCategoryCacheKey(kindKey: string, categoryId: string): string {
  return `${kindKey}:${categoryId}`
}

/** 目的: unknownエラーをUI表示用の文字列へ変換する。副作用: なし。前提: 例外オブジェクトまたは文字列を受け取る。 */
function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/** 目的: 配列インデックスが有効範囲か判定する。副作用: なし。前提: indexは整数として扱う。 */
function hasArrayIndex<T>(values: T[], index: number): boolean {
  return index >= 0 && index < values.length
}

/** 目的: 選択済みカードのフォールバック表示データを返す。副作用: なし。前提: category/group/achievementが未ロードの可能性がある。 */
function buildFallbackSelectedAchievement(): SelectableAchievement {
  return {
    title: '読み込み中のアチーブメント',
    description: '該当カテゴリを開くと詳細が表示されます。',
    sourceIndex: -1,
    patchId: 0,
    adjustmentPatchId: 0,
    tagIds: [],
    isLatestPatch: false,
    isCompleted: true,
  }
}

/** 目的: アチーブメント選択画面（旧`/selectAchievement`）の責務をReactで提供する。副作用: Cloud Storage読込・localStorage更新・ルーティング遷移を行う。前提: Homeでキャラクター取得済みである。 */
export function SelectAchievementPage(): JSX.Element {
  const navigate = useNavigate()
  const { showSnackbar } = useAppSnackbar()
  const kindDefinitions = useMemo(() => getAchievementKindDefinitions(), [])
  const [characterSession, setCharacterSession] = useState(() => readCharacterSessionResponse())
  const [selectedKindIndex, setSelectedKindIndex] = useState<number>(0)
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0)
  const [categoryCache, setCategoryCache] = useState<CategoryCacheRecord>({})
  const [selectedAchievementPaths, setSelectedAchievementPaths] = useState<AchievementIndexPath[]>(
    () => readSelectedAchievementPaths()
  )
  const [isSelectedPanelOpened, setIsSelectedPanelOpened] = useState<boolean>(true)
  const [isMobileGroupDrawerOpened, setIsMobileGroupDrawerOpened] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const previousSelectedCountRef = useRef<number>(selectedAchievementPaths.length)

  const completedTitleMap = useMemo(() => {
    if (!characterSession) {
      return new Map<string, Map<string, string>>()
    }
    return buildCompletedAchievementTitleMap(characterSession)
  }, [characterSession])

  const selectedKindDefinition =
    hasArrayIndex(kindDefinitions, selectedKindIndex) ? kindDefinitions[selectedKindIndex] : null
  const selectedCategoryDefinition =
    selectedKindDefinition && hasArrayIndex(selectedKindDefinition.categories, selectedCategoryIndex)
      ? selectedKindDefinition.categories[selectedCategoryIndex]
      : null
  const selectedCategoryCacheKey =
    selectedKindDefinition && selectedCategoryDefinition
      ? buildCategoryCacheKey(selectedKindDefinition.key, selectedCategoryDefinition.id)
      : ''
  const selectedCategoryState =
    selectedCategoryCacheKey === '' ? ({ status: 'idle' } as CategoryCacheState) : categoryCache[selectedCategoryCacheKey] ?? { status: 'idle' }
  const selectedCategory =
    selectedCategoryState.status === 'ready' ? selectedCategoryState.data : null
  const selectedGroups = selectedCategory?.group ?? []

  const selectedAchievementItems = useMemo(() => {
    return selectedAchievementPaths.map((selectedPath) => {
      const kindDefinition = hasArrayIndex(kindDefinitions, selectedPath.kindIndex)
        ? kindDefinitions[selectedPath.kindIndex]
        : null
      const categoryDefinition =
        kindDefinition && hasArrayIndex(kindDefinition.categories, selectedPath.categoryIndex)
          ? kindDefinition.categories[selectedPath.categoryIndex]
          : null
      if (!kindDefinition || !categoryDefinition) {
        return {
          indexes: selectedPath,
          data: buildFallbackSelectedAchievement(),
          kindName: 'Unknown Kind',
          categoryName: 'Unknown Category',
          groupTitle: 'Unknown Group',
        }
      }

      const categoryCacheKey = buildCategoryCacheKey(kindDefinition.key, categoryDefinition.id)
      const categoryState = categoryCache[categoryCacheKey]
      if (!categoryState || categoryState.status !== 'ready') {
        return {
          indexes: selectedPath,
          data: buildFallbackSelectedAchievement(),
          kindName: kindDefinition.name,
          categoryName: categoryDefinition.name,
          groupTitle: '読み込み中',
        }
      }

      const targetGroup = categoryState.data.group[selectedPath.groupIndex]
      const targetAchievement = targetGroup?.data[selectedPath.achievementIndex]
      return {
        indexes: selectedPath,
        data: targetAchievement ?? buildFallbackSelectedAchievement(),
        kindName: kindDefinition.name,
        categoryName: categoryDefinition.name,
        groupTitle: targetGroup?.title ?? '不明なグループ',
      }
    })
  }, [selectedAchievementPaths, kindDefinitions, categoryCache])

  const selectedPanelHeight = isSelectedPanelOpened
    ? OPEN_SELECTED_PANEL_HEIGHT
    : CLOSE_SELECTED_PANEL_HEIGHT
  const floatingButtonBottom = selectedPanelHeight + 12
  const isMaxSizeSelected = selectedAchievementPaths.length >= MAX_ACHIEVEMENT_COUNT

  useEffect(() => {
    if (!characterSession) {
      navigate('/', { replace: true })
    }
  }, [characterSession, navigate])

  useEffect(() => {
    if (!selectedKindDefinition || !selectedCategoryDefinition || !characterSession) {
      return
    }
    const categoryCacheKey = buildCategoryCacheKey(selectedKindDefinition.key, selectedCategoryDefinition.id)
    const currentState = categoryCache[categoryCacheKey]
    if (currentState?.status === 'loading' || currentState?.status === 'ready') {
      return
    }

    let cancelled = false
    setCategoryCache((currentCache) => ({
      ...currentCache,
      [categoryCacheKey]: { status: 'loading' },
    }))

    /** 目的: 選択中カテゴリの実績データを遅延取得してキャッシュへ反映する。副作用: HTTP GETとstate更新を行う。前提: kind/category定義が有効である。 */
    const loadCategory = async (): Promise<void> => {
      try {
        const categoryData = await loadAchievementCategoryByPath(
          selectedKindDefinition.key,
          selectedCategoryDefinition.id,
          completedTitleMap
        )
        if (cancelled) {
          return
        }
        setCategoryCache((currentCache) => ({
          ...currentCache,
          [categoryCacheKey]: {
            status: 'ready',
            data: categoryData,
          },
        }))
      } catch (error) {
        if (cancelled) {
          return
        }
        setCategoryCache((currentCache) => ({
          ...currentCache,
          [categoryCacheKey]: {
            status: 'error',
            errorMessage: toErrorMessage(error),
          },
        }))
      }
    }

    void loadCategory()
    return () => {
      cancelled = true
    }
  }, [selectedKindDefinition, selectedCategoryDefinition, characterSession, categoryCache, completedTitleMap])

  useEffect(() => {
    const previousCount = previousSelectedCountRef.current
    if (previousCount <= 0 && selectedAchievementPaths.length > 0) {
      setIsSelectedPanelOpened(true)
    }
    if (previousCount > 0 && selectedAchievementPaths.length <= 0) {
      setIsSelectedPanelOpened(false)
    }
    previousSelectedCountRef.current = selectedAchievementPaths.length
  }, [selectedAchievementPaths.length])

  /** 目的: 指定pathが現在選択済みか判定する。副作用: なし。前提: selectedAchievementPathsは最新状態で保持される。 */
  const isSelected = (targetPath: AchievementIndexPath): boolean => {
    return findAchievementSelectionIndex(selectedAchievementPaths, targetPath) !== -1
  }

  /** 目的: 選択状態を更新してlocalStorageへ同期する。副作用: state更新とlocalStorage書き込みを行う。前提: nextPathsは重複なしの配列である。 */
  const commitSelectedAchievementPaths = (nextPaths: AchievementIndexPath[]): void => {
    setSelectedAchievementPaths(nextPaths)
    writeSelectedAchievementPaths(nextPaths)
  }

  /** 目的: カテゴリタブ切替時にカテゴリインデックスを先頭へ戻す。副作用: state更新を行う。前提: kindIndexはkindDefinitionsの有効範囲である。 */
  const handleChangeKind = (kindIndex: number): void => {
    setSelectedKindIndex(kindIndex)
    setSelectedCategoryIndex(0)
    setMessage('')
  }

  /** 目的: 指定カテゴリへの切替を行う。副作用: state更新を行う。前提: categoryIndexはselectedKindDefinition.categoriesの有効範囲である。 */
  const handleChangeCategory = (categoryIndex: number): void => {
    setSelectedCategoryIndex(categoryIndex)
    setMessage('')
  }

  /** 目的: 取得失敗したカテゴリの再取得を実行する。副作用: キャッシュ状態をidleへ戻して再取得を発火する。前提: selectedCategoryCacheKeyが有効である。 */
  const handleReloadCategory = (): void => {
    if (selectedCategoryCacheKey === '') {
      return
    }
    setCategoryCache((currentCache) => ({
      ...currentCache,
      [selectedCategoryCacheKey]: { status: 'idle' },
    }))
  }

  /** 目的: 実績カードの選択トグルを行う。副作用: state/localStorage更新とメッセージ表示を行う。前提: achievementは現在カテゴリ内の実データである。 */
  const handleToggleAchievement = (
    groupIndex: number,
    achievementIndex: number,
    achievement: SelectableAchievement
  ): void => {
    if (!achievement.isCompleted) {
      const message = '未達成のアチーブメントは選択できません。'
      setMessage(message)
      showSnackbar({ text: message, color: 'error' })
      return
    }
    const nextPath: AchievementIndexPath = {
      kindIndex: selectedKindIndex,
      categoryIndex: selectedCategoryIndex,
      groupIndex,
      achievementIndex,
    }
    const toggledResult = toggleAchievementSelection(
      selectedAchievementPaths,
      nextPath,
      MAX_ACHIEVEMENT_COUNT
    )
    if (!toggledResult.ok) {
      const message = selectionErrorToMessage(toggledResult.errorCode)
      setMessage(message)
      showSnackbar({ text: message, color: 'error' })
      return
    }
    commitSelectedAchievementPaths(toggledResult.value)
    setMessage('')
  }

  /** 目的: 選択済みパネルから指定項目を削除する。副作用: state/localStorage更新を行う。前提: targetPathは選択済み配列内の項目である。 */
  const handleDeleteSelectedAchievement = (targetPath: AchievementIndexPath): void => {
    const nextPaths = removeAchievementSelectionByPath(selectedAchievementPaths, targetPath)
    commitSelectedAchievementPaths(nextPaths)
  }

  /** 目的: グループナビ選択時に対象グループまでスクロール移動する。副作用: ブラウザスクロール位置を変更する。前提: 対象グループ要素IDが存在する。 */
  const handleJumpToGroup = (groupIndex: number): void => {
    document.getElementById(`achievement-group-${groupIndex}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    setIsMobileGroupDrawerOpened(false)
  }

  /** 目的: Home画面へ戻る導線を提供する。副作用: ルーティング遷移を行う。前提: React Router配下で描画される。 */
  const handleBackPage = (): void => {
    navigate('/')
  }

  /** 目的: 名刺編集画面へ進む導線を提供する。副作用: ルーティング遷移を行う。前提: React Router配下で描画される。 */
  const handleNextPage = (): void => {
    navigate('/edit-chara-card')
  }

  /** 目的: キャラクターセッション破棄と選択状態リセットを実行する。副作用: localStorage更新とルーティング遷移を行う。前提: 選択フローを初期化したい場合に呼び出す。 */
  const handleResetFlow = (): void => {
    clearSelectedAchievementPaths()
    setSelectedAchievementPaths([])
    setCharacterSession(null)
    navigate('/', { replace: true })
  }

  if (!characterSession || !selectedKindDefinition || !selectedCategoryDefinition) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievement</CardTitle>
          <CardDescription>
            キャラクター情報が見つからないため、キャラクター選択画面へ戻ります。
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <section className="space-y-4 pb-[260px]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Achievement</CardTitle>
            <Badge variant="subtle">選択数 {selectedAchievementPaths.length} / {MAX_ACHIEVEMENT_COUNT}</Badge>
            {characterSession.isAchievementPrivate ? (
              <Badge variant="subtle" className="text-[var(--danger)]">
                アチーブメント非公開
              </Badge>
            ) : null}
          </div>
          <CardDescription>
            KIND とカテゴリを切り替え、達成済みアチーブメントを最大{MAX_ACHIEVEMENT_COUNT}件選択してください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
            {kindDefinitions.map((kindDefinition, kindIndex) => (
              <Button
                key={kindDefinition.key}
                type="button"
                variant={kindIndex === selectedKindIndex ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleChangeKind(kindIndex)}
              >
                {kindDefinition.name}
              </Button>
            ))}
          </div>
          {message !== '' ? <p className="text-sm font-semibold text-[var(--danger)]">{message}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_220px]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{selectedKindDefinition.name}</CardTitle>
            <CardDescription>カテゴリ一覧</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedKindDefinition.categories.map((categoryDefinition, categoryIndex) => (
              <Button
                key={categoryDefinition.id}
                type="button"
                variant={categoryIndex === selectedCategoryIndex ? 'default' : 'secondary'}
                className="w-full justify-start"
                onClick={() => handleChangeCategory(categoryIndex)}
              >
                {categoryDefinition.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-xl">{selectedCategoryDefinition.name}</CardTitle>
              <Badge variant="subtle">{selectedKindDefinition.key}</Badge>
            </div>
            <CardDescription>カテゴリ未取得時は遅延取得し、失敗時は再取得できます。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCategoryState.status === 'loading' || selectedCategoryState.status === 'idle' ? (
              <p className="text-sm text-[var(--ink-subtle)]">カテゴリデータを取得しています...</p>
            ) : null}
            {selectedCategoryState.status === 'error' ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--danger)]">
                  取得に失敗しました: {selectedCategoryState.errorMessage}
                </p>
                <Button type="button" variant="secondary" onClick={handleReloadCategory}>
                  再取得
                </Button>
              </div>
            ) : null}
            {selectedCategoryState.status === 'ready' && selectedGroups.length === 0 ? (
              <p className="text-sm text-[var(--ink-subtle)]">表示可能なグループがありません。</p>
            ) : null}
            {selectedCategoryState.status === 'ready'
              ? selectedGroups.map((group, groupIndex) => (
                  <article
                    key={`${group.title}-${groupIndex}`}
                    id={`achievement-group-${groupIndex}`}
                    className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-alt)] p-4"
                  >
                    <h3 className="text-lg font-bold text-[var(--brand-strong)]">{group.title}</h3>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {group.data.map((achievement, achievementIndex) => {
                        const selectionPath: AchievementIndexPath = {
                          kindIndex: selectedKindIndex,
                          categoryIndex: selectedCategoryIndex,
                          groupIndex,
                          achievementIndex,
                        }
                        const selected = isSelected(selectionPath)
                        return (
                          <button
                            key={`${achievement.title}-${achievementIndex}`}
                            type="button"
                            className={`space-y-2 rounded-xl border p-3 text-left transition ${
                              !achievement.isCompleted
                                ? 'cursor-not-allowed border-[var(--line)] bg-slate-100 text-[var(--ink-subtle)]'
                                : selected
                                  ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                                  : 'border-[var(--line)] bg-white hover:border-[var(--brand)]'
                            }`}
                            onClick={() => handleToggleAchievement(groupIndex, achievementIndex, achievement)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="line-clamp-2 text-sm font-semibold">{achievement.title}</p>
                              {selected ? <Badge>選択済み</Badge> : null}
                            </div>
                            <p className="line-clamp-3 text-xs text-[var(--ink-subtle)]">{achievement.description}</p>
                            <div className="flex items-center justify-between">
                              {achievement.isCompleted ? (
                                <Badge variant="subtle">達成済み</Badge>
                              ) : (
                                <Badge variant="subtle">未達成</Badge>
                              )}
                              {achievement.completedDate ? (
                                <span className="text-xs text-[var(--ink-subtle)]">
                                  {new Date(achievement.completedDate).toLocaleDateString('ja-JP')}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </article>
                ))
              : null}
          </CardContent>
        </Card>

        <Card className="hidden h-fit xl:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">グループ</CardTitle>
            <CardDescription>一覧ジャンプ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedGroups.map((group, groupIndex) => (
              <Button
                key={`${group.title}-${groupIndex}`}
                type="button"
                variant="secondary"
                className="w-full justify-start"
                onClick={() => handleJumpToGroup(groupIndex)}
              >
                {group.title}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--line)] bg-white/95 backdrop-blur"
        style={{ minHeight: `${CLOSE_SELECTED_PANEL_HEIGHT}px` }}
      >
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setIsSelectedPanelOpened((opened) => !opened)}
        >
          <span className="text-sm font-semibold">
            選択済みアチーブメント一覧：{selectedAchievementPaths.length} / {MAX_ACHIEVEMENT_COUNT}
          </span>
          <Badge variant="subtle">{isSelectedPanelOpened ? '閉じる' : '開く'}</Badge>
        </button>

        {isSelectedPanelOpened ? (
          <div className="space-y-3 border-t border-[var(--line)] px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={handleBackPage}>
                キャラクター選択
              </Button>
              <Button type="button" variant={isMaxSizeSelected ? 'default' : 'secondary'} onClick={handleNextPage}>
                名刺デザイン編集
              </Button>
              <Button type="button" variant="ghost" onClick={handleResetFlow}>
                情報をリセット
              </Button>
            </div>
            {selectedAchievementItems.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedAchievementItems.map((selectedItem, selectedIndex) => (
                  <div
                    key={`${selectedItem.indexes.kindIndex}-${selectedItem.indexes.categoryIndex}-${selectedItem.indexes.groupIndex}-${selectedItem.indexes.achievementIndex}-${selectedIndex}`}
                    className="w-72 shrink-0 rounded-xl border border-[var(--line)] bg-[var(--surface-alt)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="line-clamp-2 text-sm font-semibold">{selectedItem.data.title}</p>
                        <p className="text-xs text-[var(--ink-subtle)]">
                          {selectedItem.kindName} / {selectedItem.categoryName} / {selectedItem.groupTitle}
                        </p>
                      </div>
                      <Menu as="div" className="relative">
                        <Menu.Button className="rounded-md border border-[var(--line)] bg-white p-1 text-[var(--ink-subtle)]">
                          <EllipsisVertical className="h-4 w-4" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 z-50 mt-1 w-28 rounded-md border border-[var(--line)] bg-white p-1 shadow-lg">
                          <Menu.Item>
                            {({ focus }: { focus: boolean }) => (
                              <button
                                type="button"
                                className={`w-full rounded px-2 py-1 text-left text-sm ${
                                  focus ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)]' : ''
                                }`}
                                onClick={() => handleDeleteSelectedAchievement(selectedItem.indexes)}
                              >
                                削除
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--ink-subtle)]">{selectedItem.data.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--ink-subtle)]">アチーブメントが選択されていません。</p>
            )}
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        className="fixed right-4 z-40 h-14 w-14 rounded-full p-0 md:hidden"
        variant={isMaxSizeSelected ? 'default' : 'secondary'}
        style={{ bottom: `${floatingButtonBottom}px` }}
        onClick={() => setIsMobileGroupDrawerOpened(true)}
        aria-label="グループナビを開く"
      >
        <List className="h-5 w-5" />
      </Button>

      {!isSelectedPanelOpened ? (
        <Button
          type="button"
          className="fixed right-20 z-40 h-14 w-14 rounded-full p-0"
          variant={isMaxSizeSelected ? 'default' : 'secondary'}
          style={{ bottom: `${floatingButtonBottom}px` }}
          onClick={handleNextPage}
          aria-label="名刺デザイン編集へ進む"
        >
          次へ
        </Button>
      ) : null}

      <Dialog
        open={isMobileGroupDrawerOpened}
        onClose={() => setIsMobileGroupDrawerOpened(false)}
        className="relative z-[80] xl:hidden"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-y-0 right-0 flex w-full max-w-sm items-stretch">
          <Dialog.Panel className="ml-auto h-full w-full border-l border-[var(--line)] bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold">グループ一覧</Dialog.Title>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsMobileGroupDrawerOpened(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {selectedGroups.map((group, groupIndex) => (
                <Button
                  key={`${group.title}-${groupIndex}`}
                  type="button"
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => handleJumpToGroup(groupIndex)}
                >
                  {group.title}
                </Button>
              ))}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </section>
  )
}
