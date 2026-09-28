"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PillarPicker } from "./pillar-picker"
import type { Pillar } from "@/lib/types"

const EMPTY = { title: "", situation: "", result: "", client_type: "" }

// Alta de una historia suelta, sin pasar por el flujo de "nueva idea".
// Pensado para volcar casos apenas pasan, antes de olvidarte el número.
export function StoryForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState(EMPTY)
  const [pillar, setPillar] = useState<Pillar | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof fields) => (v: string) => setFields((s) => ({ ...s, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fields.title.trim().length < 3 || fields.situation.trim().length < 3) {
      toast.error("Completá al menos el título y qué pasó")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fields.title.trim(),
          situation: fields.situation.trim(),
          result: fields.result.trim() || undefined,
          client_type: fields.client_type.trim() || undefined,
          pillar,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo guardar")
      }
      toast.success("Historia guardada")
      setFields(EMPTY)
      setPillar(null)
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus />
        Agregar historia
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Nueva historia</h2>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Cerrar">
          <X />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="story-title">Título corto (para reconocerla después)</Label>
        <Input id="story-title" value={fields.title} onChange={(e) => set("title")(e.target.value)} placeholder="Ej: Automatización de pedidos del catering" disabled={saving} autoFocus />
      </div>

      <div className="space-y-2">
        <Label htmlFor="story-situation">¿Qué pasó?</Label>
        <Textarea id="story-situation" value={fields.situation} onChange={(e) => set("situation")(e.target.value)} placeholder="La escena, el problema, qué te dijeron" rows={3} disabled={saving} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="story-result">Dato o resultado real</Label>
          <Input id="story-result" value={fields.result} onChange={(e) => set("result")(e.target.value)} placeholder="Ej: 9 horas por semana" disabled={saving} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="story-client">Cliente o rubro</Label>
          <Input id="story-client" value={fields.client_type} onChange={(e) => set("client_type")(e.target.value)} placeholder="Ej: catering institucional" disabled={saving} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pilar habitual (opcional)</Label>
        <PillarPicker value={pillar} onChange={setPillar} disabled={saving} size="sm" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          Guardar historia
        </Button>
      </div>
    </form>
  )
}
