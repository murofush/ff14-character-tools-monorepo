import * as React from 'react'
import { cn } from '../lib/cn'

/** 目的: カード外枠を共通化し、ページ全体のトーンを統一する。副作用: なし。前提: className で追加装飾が必要な場合は外部から渡す。 */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 text-[var(--ink)] shadow-[0_10px_40px_rgba(41,42,80,0.10)]',
        className
      )}
      {...props}
    />
  )
}

/** 目的: カードの見出し領域を統一する。副作用: なし。前提: タイトル・説明をヘッダとして表示する。 */
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

/** 目的: カードタイトルのタイポグラフィを統一する。副作用: なし。前提: 短い見出し文を表示する。 */
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.ReactElement {
  return <h3 className={cn('font-display text-2xl font-bold tracking-tight', className)} {...props} />
}

/** 目的: カード説明文の視認性を統一する。副作用: なし。前提: 補足説明テキストを表示する。 */
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): React.ReactElement {
  return <p className={cn('text-sm text-[var(--ink-subtle)]', className)} {...props} />
}

/** 目的: カード本文の余白ルールを統一する。副作用: なし。前提: 任意の子要素を内包する。 */
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}
