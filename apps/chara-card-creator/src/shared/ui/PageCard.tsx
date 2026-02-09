import { PropsWithChildren, ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

type PageCardProps = PropsWithChildren<{
  title: string
  description: string
}>

/** 目的: 各ページの共通カードレイアウトを提供し、見出し構造を統一する。副作用: なし。前提: `title` と `description` は画面責務を示す文言を受け取る。 */
export function PageCard({ title, description, children }: PageCardProps): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}
