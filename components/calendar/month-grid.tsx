"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  X,
} from "lucide-react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import type { Draft } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MonthGridProps {
  scheduledDrafts: Draft[]
  unscheduledDrafts: Draft[]
}

export function MonthGrid({ scheduledDrafts, unscheduledDrafts }: MonthGridProps) {
  const router = useRouter()
  const [cursor, setCursor] = useState(new Date())
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const draftsByDay = useMemo(() => {
    const map = new Map<string, Draft[]>()
    for (const draft of scheduledDrafts) {
      if (!draft.scheduled_for) continue
      const key = format(new Date(draft.scheduled_for), "yyyy-MM-dd")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(draft)
    }
    return map
  }, [scheduledDrafts])

  async function handleSchedule(day: Date) {
    if (!selectedDraft) return
    // Programar a las 9am del día seleccionado por default
    const date = new Date(day)
    date.setHours(9, 0, 0, 0)

    setBusyId(selectedDraft.id)
    try {
      const res = await fetch(`/api/drafts/${selectedDraft.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_for: date.toISOString() }),
      })
      if (!res.ok) throw new Error("No se pudo programar")
      toast.success("Draft programado", {
        description: format(date, "EEEE d 'de' MMMM, HH:mm 'hs'", {
          locale: es,
        }),
      })
      setSelectedDraft(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setBusyId(null)
    }
  }

  async function handleUnschedule(draft: Draft) {
    setBusyId(draft.id)
    try {
      const res = await fetch(`/api/drafts/${draft.id}/schedule`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("No se pudo quitar")
      toast.success("Programación quitada")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold capitalize">
          {format(cursor, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCursor(subMonths(cursor, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCursor(new Date())}
          >
            Hoy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Banner de "modo programar" */}
      {selectedDraft ? (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div className="flex-1 text-sm">
              <p className="font-medium mb-0.5">📍 Modo agendar activo</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {selectedDraft.content}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedDraft(null)}
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Grilla del mes */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50 text-xs font-medium">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd")
            const dayDrafts = draftsByDay.get(key) ?? []
            const inMonth = isSameMonth(day, cursor)
            const today = isToday(day)

            return (
              <div
                key={key}
                onClick={() => selectedDraft && handleSchedule(day)}
                className={cn(
                  "min-h-[100px] border-t border-r p-1.5 text-xs",
                  !inMonth && "bg-muted/30 text-muted-foreground/40",
                  selectedDraft && inMonth && "cursor-pointer hover:bg-blue-500/10",
                  today && "bg-blue-500/5",
                )}
              >
                <div
                  className={cn(
                    "font-medium mb-1 flex items-center justify-between",
                    today && "text-blue-500",
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {today ? (
                    <span className="text-[10px] uppercase opacity-70">
                      hoy
                    </span>
                  ) : null}
                </div>
                <div className="space-y-1">
                  {dayDrafts.map((draft) => (
                    <DraftChip
                      key={draft.id}
                      draft={draft}
                      busy={busyId === draft.id}
                      onUnschedule={(e) => {
                        e.stopPropagation()
                        handleUnschedule(draft)
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Drawer inferior: drafts aprobados sin programar */}
      <UnscheduledDrawer
        drafts={unscheduledDrafts}
        selectedId={selectedDraft?.id ?? null}
        onSelect={setSelectedDraft}
      />
    </div>
  )
}

function DraftChip({
  draft,
  busy,
  onUnschedule,
}: {
  draft: Draft
  busy: boolean
  onUnschedule: (e: React.MouseEvent) => void
}) {
  const labels = ["Caso", "Contra", "Educ"]
  const variantLabel = labels[draft.variant - 1] ?? `V${draft.variant}`
  return (
    <div className="group bg-foreground text-background rounded px-1.5 py-1 flex items-center justify-between gap-1">
      <span className="truncate text-[10px] font-medium">
        {variantLabel}
      </span>
      <button
        onClick={onUnschedule}
        disabled={busy}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        title="Quitar programación"
      >
        {busy ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <X className="w-3 h-3" />
        )}
      </button>
    </div>
  )
}

function UnscheduledDrawer({
  drafts,
  selectedId,
  onSelect,
}: {
  drafts: Draft[]
  selectedId: string | null
  onSelect: (d: Draft | null) => void
}) {
  if (drafts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <CalendarIcon className="w-5 h-5 mx-auto mb-2 opacity-50" />
          No tenés drafts aprobados sin programar.
          <br />
          <span className="text-xs">
            Aprobá drafts en{" "}
            <a
              href="/drafts"
              className="underline underline-offset-4 hover:no-underline"
            >
              /drafts
            </a>{" "}
            para verlos acá.
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Drafts aprobados sin programar
          <Badge variant="outline" className="ml-2">
            {drafts.length}
          </Badge>
        </h3>
        <p className="text-xs text-muted-foreground">
          Click en un draft → click en un día del calendario
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {drafts.map((draft) => (
          <button
            key={draft.id}
            onClick={() =>
              onSelect(selectedId === draft.id ? null : draft)
            }
            className={cn(
              "text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors",
              selectedId === draft.id && "border-blue-500 bg-blue-500/5",
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                Variante {draft.variant}
              </span>
              <Badge variant="outline" className="text-xs">
                approved
              </Badge>
            </div>
            <p className="text-xs line-clamp-3 leading-relaxed">
              {draft.content}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
