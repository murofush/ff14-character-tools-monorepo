import { PageCard } from '../components/PageCard'

export function HomePage() {
  return (
    <PageCard
      title="Home"
      description="Nuxt ベースの画面ルーティングを React SPA + React Router に移行しました。"
    >
      <img src="/img/home.png" alt="home" className="hero" />
    </PageCard>
  )
}
