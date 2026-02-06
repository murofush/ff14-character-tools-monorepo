import { PageCard } from '../components/PageCard'

export function AboutPage() {
  return (
    <PageCard title="About" description="Nuxt から React + Vite へ移行した SPA 構成です。">
      <p>
        このアプリは Vite で起動し、React Router によるクライアントサイドルーティングで各画面を表示します。
      </p>
    </PageCard>
  )
}
