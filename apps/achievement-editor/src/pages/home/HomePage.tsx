import { JSX } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../shared/ui/badge'
import { Button } from '../../shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card'

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

/** 目的: Topページで主要機能とProfile Builderへの導線を提示する。副作用: なし。前提: ルート`/`で表示される。 */
export function HomePage(): JSX.Element {
  return (
    <section className="space-y-4">
      <Card className="bg-[linear-gradient(135deg,#fff4e8_0%,#ffffff_70%)]">
        <CardHeader>
          <Badge className="w-fit">Admin Front</Badge>
          <CardTitle>Achievement Editor</CardTitle>
          <CardDescription>
            旧Vue実装SSOTに基づき、カテゴリ編集・タグ管理・パッチ管理ルートを現行画面へ集約しています。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/battle">カテゴリ編集を開く</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
