import { JSX } from 'react'
import { Disclosure, Menu as HeadlessMenu } from '@headlessui/react'
import { ChevronDown, Menu as MenuIcon } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { buildCharacterHeaderSummary } from '../features/layout/lib/characterHeaderSummary'
import { AppSnackbarLayer } from '../features/snackbar/ui/AppSnackbarLayer'
import { readCharacterSessionResponse } from '../features/select-achievement/lib/characterSessionStorage'
import { Badge } from '../shared/ui/badge'
import { appRouteItems, getNavigationRouteItems, type AppRouteItem } from './routes'

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfXFjVTye7n5CuDmTku8XSLHBjIB18YiDBidkSTJnjFXdyu6A/viewform?usp=header'

/** 目的: 画面共通レイアウトとルーティング定義を集約する。副作用: なし。前提: BrowserRouter配下で描画される。 */
export function App(): JSX.Element {
  const navigationRouteItems = getNavigationRouteItems()
  const characterSummary = buildCharacterHeaderSummary(readCharacterSessionResponse())

  /** 目的: ヘッダナビのアクティブ状態に応じたクラス名を返す。副作用: なし。前提: React Router の `NavLink` から isActive が渡される。 */
  const navigationLinkClassName = ({ isActive }: { isActive: boolean }): string =>
    isActive
      ? 'inline-flex items-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white'
      : 'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink-subtle)] hover:bg-white/70'

  /** 目的: キャラクター取得済みかどうかでナビ導線可否を判定する。副作用: なし。前提: routeItem.requiresCharacterSession は画面責務に応じて定義される。 */
  const isRouteEnabled = (routeItem: AppRouteItem): boolean => {
    if (!routeItem.requiresCharacterSession) {
      return true
    }
    return characterSummary !== null
  }

  /** 目的: ヘッダナビ項目を「遷移可能」または「無効表示」で描画する。副作用: なし。前提: routeItemはナビ表示対象ルートである。 */
  const renderNavigationItem = (routeItem: AppRouteItem): JSX.Element => {
    if (!isRouteEnabled(routeItem)) {
      return (
        <span
          key={routeItem.path}
          aria-disabled="true"
          className="inline-flex cursor-not-allowed items-center rounded-full border border-[var(--line)] bg-white/50 px-4 py-2 text-sm font-semibold text-slate-400"
        >
          {routeItem.label}
        </span>
      )
    }

    return (
      <NavLink key={routeItem.path} to={routeItem.path} className={navigationLinkClassName}>
        {routeItem.label}
      </NavLink>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff6e7_0%,_#f6f8fb_45%,_#edf5ff_100%)] text-[var(--ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-tight">Chara Card Creator</span>
            <Badge>Web</Badge>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {characterSummary ? (
              <HeadlessMenu as="div" className="relative">
                <HeadlessMenu.Button className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--ink)] hover:border-[var(--brand)]">
                  <span>{characterSummary.characterName}</span>
                  <ChevronDown className="h-4 w-4" />
                </HeadlessMenu.Button>
                <HeadlessMenu.Items className="absolute right-0 z-50 mt-2 w-[min(28rem,85vw)] rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xl focus:outline-none">
                  <div className="space-y-2">
                    <p className="font-display text-lg font-bold">{characterSummary.characterName}</p>
                    {characterSummary.characterMetaLine !== '' ? (
                      <p className="text-sm text-[var(--ink-subtle)]">{characterSummary.characterMetaLine}</p>
                    ) : null}
                    {characterSummary.profileDetailLines.map((line) => (
                      <p key={line} className="text-sm text-[var(--ink-subtle)]">
                        {line}
                      </p>
                    ))}
                    <a
                      href={characterSummary.lodestoneProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-sm font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
                    >
                      Lodestoneプロフィールを開く
                    </a>
                  </div>
                </HeadlessMenu.Items>
              </HeadlessMenu>
            ) : null}

            <nav className="hidden gap-2 lg:flex">{navigationRouteItems.map((routeItem) => renderNavigationItem(routeItem))}</nav>
          </div>

          <Disclosure as="div" className="md:hidden">
            <Disclosure.Button className="inline-flex items-center rounded-xl border border-[var(--line)] bg-white p-2 text-[var(--ink)]">
              <MenuIcon className="h-5 w-5" />
            </Disclosure.Button>
            <Disclosure.Panel className="absolute left-0 top-full w-full border-b border-[var(--line)] bg-white p-3 shadow-lg">
              <div className="mx-auto flex max-w-6xl flex-col gap-2">
                {characterSummary ? (
                  <div className="mb-1 rounded-xl border border-[var(--line)] bg-[var(--surface-alt)] p-3">
                    <p className="text-sm font-bold">{characterSummary.characterName}</p>
                    {characterSummary.characterMetaLine !== '' ? (
                      <p className="text-xs text-[var(--ink-subtle)]">{characterSummary.characterMetaLine}</p>
                    ) : null}
                  </div>
                ) : null}
                {navigationRouteItems.map((routeItem) => renderNavigationItem(routeItem))}
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

      <AppSnackbarLayer />

      <footer className="border-t border-[var(--line)] bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-[var(--ink-subtle)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1">
            <p>(C) SQUARE ENIX CO., LTD. All Rights Reserved.</p>
            <p>(C) forfan</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={FEEDBACK_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
            >
              不具合報告、要望など
            </a>
            <Link to="/about" className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline">
              このサイトについて
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
