"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PillarPicker } from "./pillar-picker"
import type { Pillar } from "@/lib/types"

const MAX_LENGTH = 2000

// Los campos opcionales son hechos reales para la IA: el prompt tiene
// prohibido inventar, así que lo que no esté acá sale como [COMPLETAR].
function buildRawText(f: {
  idea: string
  happened: string
  result: string
  client: string
}) {
  return [
    f.idea.trim(),
    f.happened.trim() && `Qué pasó: ${f.happened.trim()}`,
    f.result.trim() && `Dato o resultado real: ${f.result.trim()}`,
    f.client.trim() && `Cliente / rubro: ${f.client.trim()}`,
  ]
    .filter(Boolean)
    .join("\n")
}

export function NewIdeaForm() {
  const router = useRouter()
  const [fields, setFields] = useState({ idea: "", happened: "", result: "", client: "" })
  const [pillar, setPillar] = useState<Pillar | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const rawText = buildRawText(fields)
  const tooLong = rawText.length > MAX_LENGTH
  const set = (k: keyof typeof fields) => (v: string) =>
    setFields((s) => ({ ...s, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fields.idea.trim().length < 3) {
      toast.error("Escribí la idea (al menos unas palabras)")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: rawText, pillar, source: "web" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo guardar")
      }
      toast.success("Idea guardada")
      router.push("/ideas")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="idea" className="text-base font-medium">
            La idea
          </Label>
          <Textarea
            id="idea"
            value={fields.idea}
            onChange={(e) => set("idea")(e.target.value)}
            placeholder="Ej: automatizamos el control de stock de una carnicería con Sheets + WhatsApp"
            rows={3}
            disabled={submitting}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-medium">Pilar</Label>
          <PillarPicker value={pillar} onChange={setPillar} disabled={submitting} />
          <p className="text-xs text-muted-foreground">
            Opcional. Si elegís uno, al menos una de las 3 variantes lo usa.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold">Hechos reales</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Opcional, pero es lo que más mejora los posts: la IA no inventa
            datos, así que lo que no pongas acá queda como{" "}
            <code className="text-xs bg-warning-soft text-warning px-1 py-0.5 rounded">
              [COMPLETAR]
            </code>
            .
          </p>
        </div>

        <Field id="happened" label="¿Qué pasó?" placeholder="La escena: qué te dijo el cliente, qué viste, qué salió mal" value={fields.happened} onChange={set("happened")} disabled={submitting} multiline />
        <Field id="result" label="Dato o resultado real" placeholder="Ej: pasaron de 3 horas diarias a 20 minutos" value={fields.result} onChange={set("result")} disabled={submitting} />
        <Field id="client" label="Cliente o rubro" placeholder="Ej: carnicería de barrio, 8 empleados" value={fields.client} onChange={set("client")} disabled={submitting} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className={tooLong ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
          {tooLong
            ? `Muy largo: ${rawText.length}/${MAX_LENGTH} caracteres`
            : "Después generás los 3 drafts desde Ideas."}
        </p>
        <Button type="submit" size="lg" disabled={submitting || tooLong}>
          {submitting ? <Loader2 className="animate-spin" /> : null}
          Guardar idea
        </Button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  multiline,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  multiline?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} disabled={disabled} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
      )}
    </div>
  )
}
