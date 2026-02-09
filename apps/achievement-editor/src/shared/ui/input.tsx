import * as React from 'react'
import { cn } from '../lib/cn'

/** 目的: 入力欄コンポーネントを統一し、フォームの操作感を揃える。副作用: なし。前提: 制御コンポーネントとして value/onChange を外部から受ける。 */
export function Input({
  className,
  type = 'text',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>): React.ReactElement {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-base text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
        className
      )}
      {...props}
    />
  )
}
