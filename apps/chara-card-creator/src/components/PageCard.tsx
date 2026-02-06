import { PropsWithChildren } from 'react'

type PageCardProps = PropsWithChildren<{
  title: string
  description: string
}>

export function PageCard({ title, description, children }: PageCardProps) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </section>
  )
}
