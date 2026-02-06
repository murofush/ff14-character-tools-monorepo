import { Link } from 'react-router-dom'

const features = [
  {
    title: 'テンプレート搭載',
    description: '固定募集・フレンド募集・FC募集向けの雛形を選んですぐに作れます。',
  },
  {
    title: '即時プレビュー',
    description: '入力内容がリアルタイムに整形され、完成イメージを確認できます。',
  },
  {
    title: 'ワンクリックコピー',
    description: '作成した自己紹介文を、そのままX・Discord・掲示板へ貼り付け可能です。',
  },
]

export function HomePage() {
  return (
    <section>
      <div className="hero card">
        <span className="badge">React + Vite SPA</span>
        <h1>FF14自己紹介メーカー</h1>
        <p>固定募集・フレンド募集・FC募集に使える自己紹介文を、簡単に作成できます。</p>
        <Link className="button" to="/profile-builder">
          今すぐ作成する
        </Link>
      </div>

      <div className="feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="card feature-card">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
