"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MousePointerClick,
  Send,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PillarBadge } from "@/components/common/badges"
import { PILLAR_DOT, draftTemplate, type Draft } from "@/lib/types"

// Horarios habituales de buen alcance en LinkedIn (hora local).
const TIMES = ["08:00", "09:00", "12:30", "18:00"]

interface MonthGridProps {
  scheduledDrafts: Draft[]
  unscheduledDrafts: Draft[]
  initialSelectedId?: string
}

export function MonthGrid({
  scheduledDrafts,
  unscheduledDrafts,
  initialSelectedId,
}: MonthGridProps) {
  const router = useRouter()
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState<Draft | null>(
    () =>
      [...unscheduledDrafts, ...scheduledDrafts].find(
        (d) => d.id === initialSelectedId,
      ) ?? null,
  )
  const [time, setTime] = useState("09:00")
  const [busyId, setBusyId] = useState<string | null>(null)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const byDay = useMemo(() => {
    const map = new Map<string, Draft[]>()
    for (const d of scheduledDrafts) {
      if (!d.scheduled_for) continue
      const key = format(new Date(d.scheduled_for), "yyyy-MM-dd")
      map.set(key, [...(map.get(key) ?? []), d])
    }
    return map
  }, [scheduledDrafts])

  const monthAgenda = scheduledDrafts.filter(
    (d) => d.scheduled_for && isSameMonth(new Date(d.scheduled_for), cursor),
  )
  const today = startOfDay(new Date())

  // En el celular la bandeja queda debajo de la grilla: al elegir un draft
  // subimos para que se vea dónde tocar.
  function select(draft: Draft | null) {
    setSelected(draft)
    if (draft) {
      document
        .querySelector("main .overflow-y-auto")
        ?.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  async function schedule(day: Date) {
    if (!selected) return
    const [h, m] = time.split(":").map(Number)
    const date = new Date(day)
    date.setHours(h, m, 0, 0)
    if (isBefore(date, new Date())) {
      toast.error("Ese horario ya pasó. Elegí otro día u hora.")
      return
    }

    setBusyId(selected.id)
    try {
      const res = await fetch(`/api/drafts/${selected.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_for: date.toISOString() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "No se pudo programar")
      const when = format(date, "EEEE d 'de' MMMM, HH:mm 'hs'", { locale: es })
      toast.success(
        data.publora?.state === "scheduled"
          ? "Programado: se publica solo en LinkedIn"
          : "Draft programado",
        { description: when },
      )
      // Programado en la app pero no en LinkedIn (faltan datos, error, etc.)
      if (data.publora?.message) toast.warning(data.publora.message)
      setSelected(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setBusyId(null)
    }
  }

  async function unschedule(draft: Draft) {
    setBusyId(draft.id)
    try {
      const res = await fetch(`/api/drafts/${draft.id}/schedule`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "No se pudo quitar")
      toast.success(
        data.publora?.state === "cancelled"
          ? "Programación quitada (también en LinkedIn)"
          : "Programación quitada",
      )
      if (data.publora?.message) toast.warning(data.publora.message)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4 min-w-0">
        {/* Barra de "modo programar" */}
        {selected ? (
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-sm">
            <MousePointerClick className="w-4 h-4 shrink-0" />
            <p className="text-sm min-w-0 flex-1">
              <span className="font-medium">Tocá un día</span>
              <span className="text-white/70"> para </span>
              <span className="line-clamp-1 inline">
                &ldquo;{selected.content.split("\n")[0].slice(0, 60)}&rdquo;
              </span>
            </p>
            <div className="flex items-center gap-1 rounded-lg bg-white/10 p-0.5" role="radiogroup" aria-label="Hora">
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={time === t}
                  onClick={() => setTime(t)}
                  className={cn(
                    "h-7 rounded-md px-2 text-xs tabular-nums",
                    time === t ? "bg-white text-primary font-medium" : "text-white/80 hover:text-white",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setSelected(null)}>
              <X /> Cancelar
            </Button>
          </div>
        ) : null}

        {/* Encabezado del mes */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold capitalize">
            {format(cursor, "MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex gap-1">
            <Button size="icon-sm" variant="outline" aria-label="Mes anterior" onClick={() => setCursor(subMonths(cursor, 1))}>
              <ChevronLeft />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>
              Hoy
            </Button>
            <Button size="icon-sm" variant="outline" aria-label="Mes siguiente" onClick={() => setCursor(addMonths(cursor, 1))}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        {/* Grilla */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-7 border-b border-border bg-secondary/60 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="px-2 py-2 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              const dayDrafts = byDay.get(key) ?? []
              const inMonth = isSameMonth(day, cursor)
              const past = isBefore(day, today)
              const pickable = !!selected && inMonth && !past
              return (
                <div
                  key={key}
                  role={pickable ? "button" : undefined}
                  tabIndex={pickable ? 0 : undefined}
                  aria-label={pickable ? `Programar el ${format(day, "d 'de' MMMM", { locale: es })}` : undefined}
                  onClick={pickable ? () => schedule(day) : undefined}
                  onKeyDown={
                    pickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            schedule(day)
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "relative min-h-16 md:min-h-28 border-b border-r border-border p-1.5 text-left [&:nth-child(7n)]:border-r-0",
                    !inMonth && "bg-secondary/30",
                    pickable && "cursor-pointer hover:bg-accent",
                    selected && past && inMonth && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "inline-grid place-items-center w-6 h-6 rounded-full text-xs",
                      !inMonth && "text-muted-foreground/50",
                      isToday(day) && "bg-primary text-primary-foreground font-semibold",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {/* Celular: puntos. Desktop: chips con hora */}
                  <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                    {dayDrafts.map((d) => {
                      const t = draftTemplate(d)
                      return <span key={d.id} className={cn("w-2 h-2 rounded-full", t ? PILLAR_DOT[t] : "bg-muted-foreground")} />
                    })}
                  </div>
                  <div className="mt-1 hidden md:block space-y-1">
                    {dayDrafts.map((d) => (
                      <DayChip
                        key={d.id}
                        draft={d}
                        busy={busyId === d.id}
                        onMove={() => select(d)}
                        onUnschedule={() => unschedule(d)}
                      />
                    ))}
                  </div>
                  {selected && busyId === selected.id && pickable ? (
                    <Loader2 className="absolute right-1.5 top-1.5 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* Agenda del mes (principal en celular) */}
        <section className="space-y-2 md:hidden">
          <h3 className="text-base font-semibold">Este mes</h3>
          {monthAgenda.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada programado en este mes.</p>
          ) : (
            <ul className="rounded-2xl border border-border bg-card divide-y divide-border">
              {monthAgenda.map((d) => (
                <li key={d.id} className="flex items-center gap-3 p-3">
                  <div className="w-10 text-center shrink-0">
                    <p className="text-[10px] uppercase text-muted-foreground">{format(new Date(d.scheduled_for!), "EEE", { locale: es })}</p>
                    <p className="font-heading text-lg font-semibold leading-none">{format(new Date(d.scheduled_for!), "d")}</p>
                  </div>
                  <Link href={`/drafts?focus=${d.id}`} className="min-w-0 flex-1">
                    <p className="text-sm line-clamp-1">{d.content.split("\n")[0]}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(d.scheduled_for!), "HH:mm")} hs
                      {d.publora_status === "scheduled" ? " · automático" : ""}
                    </p>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => select(d)}>
                    Mover
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Bandeja: aprobados sin fecha */}
      <aside className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-base font-semibold">Sin fecha</h3>
          <span className="text-sm text-muted-foreground tabular-nums">{unscheduledDrafts.length}</span>
        </div>
        {unscheduledDrafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center text-sm text-muted-foreground">
            <CalendarDays className="w-5 h-5 mx-auto mb-2 opacity-60" />
            No hay aprobados esperando fecha.{" "}
            <Link href="/drafts" className="underline underline-offset-4">Revisá drafts</Link>.
          </div>
        ) : (
          <div className="space-y-2">
            {unscheduledDrafts.map((d) => {
              const isSel = selected?.id === d.id
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => select(isSel ? null : d)}
                  className={cn(
                    "w-full rounded-2xl border bg-card p-3 text-left transition",
                    isSel ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <PillarBadge pillar={draftTemplate(d)} />
                    <span className={cn("text-xs", isSel ? "text-primary font-medium" : "text-muted-foreground")}>
                      {isSel ? "Elegí un día →" : "Programar"}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-3 leading-relaxed">{d.content}</p>
                </button>
              )
            })}
          </div>
        )}
      </aside>
    </div>
  )
}

function DayChip({
  draft,
  busy,
  onMove,
  onUnschedule,
}: {
  draft: Draft
  busy: boolean
  onMove: () => void
  onUnschedule: () => void
}) {
  const t = draftTemplate(draft)
  const auto = draft.publora_status === "scheduled"
  return (
    <div className="group/chip rounded-md border border-border bg-background px-1.5 py-1 text-[11px] leading-tight">
      <div className="flex items-center gap-1">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", t ? PILLAR_DOT[t] : "bg-muted-foreground")} />
        <span className="font-medium tabular-nums">{format(new Date(draft.scheduled_for!), "HH:mm")}</span>
        {auto ? <Send className="w-3 h-3 text-success" aria-label="Se publica solo" /> : null}
      </div>
      <p className="mt-0.5 line-clamp-2 text-muted-foreground">{draft.content.split("\n")[0]}</p>
      <div className="mt-1 flex gap-1 opacity-0 group-hover/chip:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onMove()
          }}
          className="rounded px-1 hover:bg-accent text-accent-foreground"
        >
          Mover
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onUnschedule()
          }}
          disabled={busy}
          className="rounded px-1 hover:bg-secondary text-muted-foreground"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Quitar"}
        </button>
      </div>
    </div>
  )
}
