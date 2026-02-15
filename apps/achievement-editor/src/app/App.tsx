import { JSX } from 'react'
import { Disclosure } from '@headlessui/react'
import { Menu } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Badge } from '../shared/ui/badge'
import { AuthSessionControl } from '../features/auth/ui/AuthSessionControl'
import { AppSnackbarLayer } from '../features/snackbar/ui/AppSnackbarLayer'
import { appRouteItems, getNavigationRouteItems } from './routes'

/** 目的: achievement-editor全体の共通レイアウトとルーティングを定義する。副作用: なし。前提: BrowserRouter配下で描画される。 */
export function App(): JSX.Element {
  const navigationRouteItems = getNavigationRouteItems()

  /** 目的: ヘッダナビのアクティブ状態に応じたクラス名を返す。副作用: なし。前提: React Router の `NavLink` から isActive が渡される。 */
  const navigationLinkClassName = ({ isActive }: { isActive: boolean }): string =>
    isActive
      ? 'inline-flex items-center rounded-full bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white'
      : 'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--ink-subtle)] hover:bg-white'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff8ef_0%,_#fffdf8_38%,_#f4f5ff_100%)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-tight">Achievement Editor</span>
            <Badge>Web</Badge>
          </Link>
          <nav className="hidden flex-wrap items-center gap-1 xl:flex">
            {navigationRouteItems.map((routeItem) => (
              <NavLink key={routeItem.path} to={routeItem.path} className={navigationLinkClassName}>
                {routeItem.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden xl:block">
              <AuthSessionControl />
            </div>
            <Disclosure as="div" className="xl:hidden">
              <Disclosure.Button className="inline-flex items-center rounded-xl border border-[var(--line)] bg-white p-2 text-[var(--ink)]">
                <Menu className="h-5 w-5" />
              </Disclosure.Button>
              <Disclosure.Panel className="absolute left-0 top-full w-full border-b border-[var(--line)] bg-white p-3 shadow-lg">
                <div className="mx-auto mb-3 max-w-7xl">
                  <AuthSessionControl />
                </div>
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-3">
                  {navigationRouteItems.map((routeItem) => (
                    <NavLink key={routeItem.path} to={routeItem.path} className={navigationLinkClassName}>
                      {routeItem.label}
                    </NavLink>
                  ))}
                </div>
              </Disclosure.Panel>
            </Disclosure>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Routes>
          {appRouteItems.map((routeItem) => (
            <Route key={routeItem.path} path={routeItem.path} element={routeItem.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AppSnackbarLayer />
    </div>
  )
}
