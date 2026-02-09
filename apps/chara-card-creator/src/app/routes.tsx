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
  element: JSX.Element
}

export const appRouteItems: AppRouteItem[] = [
  { path: '/', label: 'Home', showInNavigation: true, element: <HomePage /> },
  { path: '/edit-chara-card', label: 'Edit Card', showInNavigation: true, element: <EditCharaCardPage /> },
  { path: '/editCharaCard', label: 'Edit Card(legacy)', showInNavigation: false, element: <Navigate to="/edit-chara-card" replace /> },
  { path: '/select-achievement', label: 'Achievement', showInNavigation: true, element: <SelectAchievementPage /> },
  { path: '/selectAchievement', label: 'Achievement(legacy)', showInNavigation: false, element: <Navigate to="/select-achievement" replace /> },
  { path: '/about', label: 'About', showInNavigation: true, element: <AboutPage /> },
]

/** 目的: ヘッダナビ表示対象のルートだけを返す。副作用: なし。前提: `appRouteItems` に画面ルートが定義済みである。 */
export function getNavigationRouteItems(): AppRouteItem[] {
  return appRouteItems.filter((routeItem) => routeItem.showInNavigation)
}
