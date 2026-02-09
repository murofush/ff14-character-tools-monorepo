import { JSX } from 'react'
import { Disclosure } from '@headlessui/react'
import { Menu } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Badge } from '../shared/ui/badge'
import { getNavigationRouteItems, appRouteItems } from './routes'

/** 目的: 画面共通レイアウトとルーティング定義を集約する。副作用: なし。前提: BrowserRouter配下で描画される。 */
export function App(): JSX.Element {
  const navigationRouteItems = getNavigationRouteItems()

  /** 目的: ヘッダナビのアクティブ状態に応じたクラス名を返す。副作用: なし。前提: React Router の `NavLink` から isActive が渡される。 */
  const navigationLinkClassName = ({ isActive }: { isActive: boolean }): string =>
    isActive
      ? 'inline-flex items-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white'
      : 'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink-subtle)] hover:bg-white/70'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff6e7_0%,_#f6f8fb_45%,_#edf5ff_100%)] text-[var(--ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-tight">Chara Card Creator</span>
            <Badge>React</Badge>
          </Link>
          <nav className="hidden gap-2 md:flex">
            {navigationRouteItems.map((routeItem) => (
              <NavLink key={routeItem.path} to={routeItem.path} className={navigationLinkClassName}>
                {routeItem.label}
              </NavLink>
            ))}
          </nav>
          <Disclosure as="div" className="md:hidden">
            <Disclosure.Button className="inline-flex items-center rounded-xl border border-[var(--line)] bg-white p-2 text-[var(--ink)]">
              <Menu className="h-5 w-5" />
            </Disclosure.Button>
            <Disclosure.Panel className="absolute left-0 top-full w-full border-b border-[var(--line)] bg-white p-3 shadow-lg">
              <div className="mx-auto flex max-w-6xl flex-col gap-2">
                {navigationRouteItems.map((routeItem) => (
                  <NavLink key={routeItem.path} to={routeItem.path} className={navigationLinkClassName}>
                    {routeItem.label}
                  </NavLink>
                ))}
              </div>
            </Disclosure.Panel>
          </Disclosure>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Routes>
          {appRouteItems.map((routeItem) => (
            <Route key={routeItem.path} path={routeItem.path} element={routeItem.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
