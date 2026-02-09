import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** 目的: shadcn/ui 互換のクラス結合処理を提供する。副作用: なし。前提: 可変長で渡された class 名を Tailwind ルールで統合する。 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
