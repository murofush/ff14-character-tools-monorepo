import * as React from 'react'
import { cn } from '../lib/cn'

/** 目的: 複数行入力コンポーネントを統一し、フォームの見た目と操作感を揃える。副作用: なし。前提: 制御コンポーネントとして value/onChange を外部から受ける。 */
export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>): React.ReactElement {
  return (
    <textarea
      className={cn(
        'flex min-h-[96px] w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
        className
      )}
      {...props}
    />
  )
}
