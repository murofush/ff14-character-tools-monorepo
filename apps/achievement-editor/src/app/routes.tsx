import { JSX } from 'react'
import { HomePage } from '../pages/home/HomePage'
import { ProfileBuilderPage } from '../pages/profile-builder/ProfileBuilderPage'
import { EditorRoutePage } from '../pages/editor/EditorRoutePage'
import { PatchEditorPage } from '../pages/editor/PatchEditorPage'
import { TagEditorPage } from '../pages/editor/TagEditorPage'

export type AppRouteItem = {
  path: string
  label: string
  showInNavigation: boolean
  element: JSX.Element
}

const categoryRouteItems: AppRouteItem[] = [
  {
    path: '/battle',
    label: 'Battle',
    showInNavigation: true,
    element: <EditorRoutePage title="Battle" description="戦闘系アチーブメントの編集画面です。" routeKey="battle" />,
  },
  {
    path: '/character',
    label: 'Character',
    showInNavigation: true,
    element: <EditorRoutePage title="Character" description="キャラクター系アチーブメントの編集画面です。" routeKey="character" />,
  },
  {
    path: '/crafting_gathering',
    label: 'Crafting',
    showInNavigation: true,
    element: <EditorRoutePage title="Crafting / Gathering" description="製作・採集系アチーブメントの編集画面です。" routeKey="crafting_gathering" />,
  },
  {
    path: '/exploration',
    label: 'Exploration',
    showInNavigation: true,
    element: <EditorRoutePage title="Exploration" description="探索系アチーブメントの編集画面です。" routeKey="exploration" />,
  },
  {
    path: '/grand_company',
    label: 'Grand Company',
    showInNavigation: true,
    element: <EditorRoutePage title="Grand Company" description="グランドカンパニー系アチーブメントの編集画面です。" routeKey="grand_company" />,
  },
  {
    path: '/items',
    label: 'Items',
    showInNavigation: true,
    element: <EditorRoutePage title="Items" description="アイテム系アチーブメントの編集画面です。" routeKey="items" />,
  },
  {
    path: '/legacy',
    label: 'Legacy',
    showInNavigation: true,
    element: <EditorRoutePage title="Legacy" description="レガシー系アチーブメントの編集画面です。" routeKey="legacy" />,
  },
  {
    path: '/pvp',
    label: 'PvP',
    showInNavigation: true,
    element: <EditorRoutePage title="PvP" description="PvP系アチーブメントの編集画面です。" routeKey="pvp" />,
  },
  {
    path: '/quests',
    label: 'Quests',
    showInNavigation: true,
    element: <EditorRoutePage title="Quests" description="クエスト系アチーブメントの編集画面です。" routeKey="quests" />,
  },
]

const adminRouteItems: AppRouteItem[] = [
  {
    path: '/tag',
    label: 'Tag',
    showInNavigation: true,
    element: <TagEditorPage />,
  },
  {
    path: '/patch',
    label: 'Patch',
    showInNavigation: true,
    element: <PatchEditorPage />,
  },
]

export const appRouteItems: AppRouteItem[] = [
  { path: '/', label: 'Home', showInNavigation: true, element: <HomePage /> },
  ...categoryRouteItems,
  ...adminRouteItems,
  { path: '/profile-builder', label: 'Profile Builder', showInNavigation: false, element: <ProfileBuilderPage /> },
]

/** 目的: ヘッダナビ表示対象のルートだけを返す。副作用: なし。前提: `appRouteItems` に画面ルートが定義済みである。 */
export function getNavigationRouteItems(): AppRouteItem[] {
  return appRouteItems.filter((routeItem) => routeItem.showInNavigation)
}
