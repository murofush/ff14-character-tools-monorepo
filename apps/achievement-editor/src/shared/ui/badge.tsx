import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--brand-soft)] text-[var(--brand-strong)]',
        subtle: 'border-[var(--line)] bg-white text-[var(--ink-subtle)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

/** 目的: ステータス表示用の小型ラベルを共通化する。副作用: なし。前提: variant は定義済み値を受け取る。 */
export function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
