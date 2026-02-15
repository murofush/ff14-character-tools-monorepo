import { JSX } from 'react'
import { PageCard } from '../../shared/ui/PageCard'

/** 目的: About画面の説明コンテンツを表示する。副作用: なし。前提: ルート`/about`から表示される。 */
export function AboutPage(): JSX.Element {
  return (
    <PageCard title="About" description="Nuxt から Vite ベースへ移行した SPA 構成です。">
      <p>
        このアプリは Vite で起動し、クライアントサイドルーティングで各画面を表示します。
      </p>
    </PageCard>
  )
}
