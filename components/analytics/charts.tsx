// Gráficos livianos en HTML/CSS, siguiendo la skill dataviz:
// - una sola serie → un solo color (el de marca), sin leyenda
// - barras finas (≤ 24px), punta redondeada 4px, base recta
// - valores en tinta de texto, nunca del color de la barra
// - tooltip al pasar el mouse / enfocar con teclado
// - la tabla de posts es la vista accesible con todos los números

import { PillarBadge } from "@/components/common/badges"
import type { Pillar } from "@/lib/types"

const nf = new Intl.NumberFormat("es-AR")
const pct = (v: number) => `${(v * 100).toFixed(1)}%`

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background opacity-0 shadow-lg transition-opacity group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100"
    >
      {children}
    </div>
  )
}

export interface FormatRow {
  pillar: Pillar | null
  posts: number
  impressions: number
  interactions: number
  engagement: number
}

// Engagement por formato: barras horizontales, ordenadas de mayor a menor.
export function FormatBars({ rows }: { rows: FormatRow[] }) {
  const sorted = [...rows].sort((a, b) => b.engagement - a.engagement)
  const max = Math.max(...sorted.map((r) => r.engagement), 0.0001)
  return (
    <div className="space-y-3">
      {sorted.map((r) => (
        <div
          key={r.pillar ?? "none"}
          className="grid grid-cols-[112px_1fr] md:grid-cols-[140px_1fr] items-center gap-3"
        >
          <div className="min-w-0">
            <PillarBadge pillar={r.pillar} />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {r.posts} {r.posts === 1 ? "post" : "posts"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              tabIndex={0}
              className="group/mark relative h-4 rounded-r-[4px] bg-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ width: `${Math.max((r.engagement / max) * 80, 1.5)}%` }}
              aria-label={`${pct(r.engagement)} de engagement`}
            >
              <Tooltip>
                {nf.format(r.impressions)} impresiones · {nf.format(r.interactions)} interacciones
              </Tooltip>
            </div>
            <span className="text-sm font-medium tabular-nums">{pct(r.engagement)}</span>
          </div>
        </div>
      ))}
      <div className="grid grid-cols-[112px_1fr] md:grid-cols-[140px_1fr] gap-3">
        <span />
        <span className="border-t border-border pt-1 text-[11px] text-muted-foreground">
          Engagement = (likes + comentarios + reposts) / impresiones
        </span>
      </div>
    </div>
  )
}

export interface PostPoint {
  id: string
  label: string // fecha corta
  impressions: number
  engagement: number
  hook: string
}

// Impresiones por post en orden cronológico (columnas, una sola serie).
export function ImpressionColumns({ points }: { points: PostPoint[] }) {
  const max = Math.max(...points.map((p) => p.impressions), 1)
  const top = points.reduce((a, b) => (b.impressions > a.impressions ? b : a), points[0])
  return (
    <div>
      <div className="relative flex h-44 items-end gap-[2px] border-b border-border">
        {/* Línea guía del máximo (hairline, recesiva); el valor va en la barra */}
        <div className="absolute inset-x-0 top-0 border-t border-border" />
        {points.map((p) => (
          <div
            key={p.id}
            tabIndex={0}
            className="group/mark relative flex-1 max-w-6 rounded-t-[4px] bg-primary/85 hover:bg-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ height: `${Math.max((p.impressions / max) * 100, 1.5)}%` }}
            aria-label={`${p.label}: ${nf.format(p.impressions)} impresiones`}
          >
            <Tooltip>
              <span className="block font-medium">{p.label} · {nf.format(p.impressions)} impresiones</span>
              <span className="block max-w-56 truncate opacity-75">{p.hook}</span>
            </Tooltip>
            {p.id === top.id ? (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-medium tabular-nums">
                {nf.format(p.impressions)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </div>
  )
}
