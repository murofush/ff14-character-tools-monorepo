import { JSX } from 'react'
import { Navigate } from 'react-router-dom'
import { AboutPage } from '../pages/about/AboutPage'
import { EditCharaCardPage } from '../pages/edit-chara-card/EditCharaCardPage'
import { HomePage } from '../pages/home/HomePage'
import { SelectAchievementPage } from '../pages/select-achievement/SelectAchievementPage'

export type AppRouteItem = {
  path: string
  label: string
  showInNavigation: boolean
  requiresCharacterSession: boolean
  element: JSX.Element
}

export const appRouteItems: AppRouteItem[] = [
  {
    path: '/',
    label: 'キャラクター選択',
    showInNavigation: true,
    requiresCharacterSession: false,
    element: <HomePage />,
  },
  {
    path: '/select-achievement',
    label: 'アチーブメント選択',
    showInNavigation: true,
    requiresCharacterSession: true,
    element: <SelectAchievementPage />,
  },
  {
    path: '/edit-chara-card',
    label: '名刺デザイン編集',
    showInNavigation: true,
    requiresCharacterSession: true,
    element: <EditCharaCardPage />,
  },
  {
    path: '/about',
    label: 'このサイトについて',
    showInNavigation: false,
    requiresCharacterSession: false,
    element: <AboutPage />,
  },
  {
    path: '/editCharaCard',
    label: '名刺デザイン編集(legacy)',
    showInNavigation: false,
    requiresCharacterSession: false,
    element: <Navigate to="/edit-chara-card" replace />,
  },
  {
    path: '/selectAchievement',
    label: 'アチーブメント選択(legacy)',
    showInNavigation: false,
    requiresCharacterSession: false,
    element: <Navigate to="/select-achievement" replace />,
  },
]

/** 目的: ヘッダナビ表示対象のルートだけを返す。副作用: なし。前提: `appRouteItems` に画面ルートが定義済みである。 */
export function getNavigationRouteItems(): AppRouteItem[] {
  return appRouteItems.filter((routeItem) => routeItem.showInNavigation)
}
