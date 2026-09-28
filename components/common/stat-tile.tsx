import Link from "next/link"
import { cn } from "@/lib/utils"

// Stat tile (dataviz: un número titular no necesita gráfico).
// Número grande en tinta primaria, etiqueta en tinta secundaria.
export function StatTile({
  label,
  value,
  hint,
  href,
  emphasis,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  href?: string
  emphasis?: boolean
}) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-heading text-3xl font-semibold mt-1 leading-none",
          emphasis && "text-primary",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="text-xs text-muted-foreground mt-2">{hint}</p>
      ) : null}
    </>
  )
  const className = cn(
    "block rounded-2xl border border-border bg-card p-4 md:p-5",
    href && "hover:border-primary/40 hover:shadow-sm transition",
  )
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
