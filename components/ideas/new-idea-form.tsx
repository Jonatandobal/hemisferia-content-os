"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Pillar } from "@/lib/types"

export function NewIdeaForm() {
  const router = useRouter()
  const [rawText, setRawText] = useState("")
  const [pillar, setPillar] = useState<Pillar | "none">("none")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rawText.trim().length < 3) {
      toast.error("La idea es muy corta (mínimo 3 caracteres)")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: rawText,
          pillar: pillar === "none" ? null : pillar,
          source: "web",
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo guardar")
      }

      toast.success("Idea guardada")
      setRawText("")
      setPillar("none")
      router.push("/ideas")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="raw_text">Idea cruda</Label>
        <Textarea
          id="raw_text"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Ej: cliente carnicería que automaticé control de stock con sheets + whatsapp"
          rows={5}
          disabled={submitting}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Escribilo como te venga. Después la IA lo convierte en posts.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pillar">Pilar (opcional)</Label>
        <Select
          value={pillar}
          onValueChange={(v) => setPillar(v as Pillar | "none")}
          disabled={submitting}
        >
          <SelectTrigger id="pillar" className="w-full">
            <SelectValue placeholder="Elegí un pilar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin clasificar</SelectItem>
            <SelectItem value="caso">Caso real</SelectItem>
            <SelectItem value="contrarian">Contrarian</SelectItem>
            <SelectItem value="educativo">Educativo</SelectItem>
            <SelectItem value="founder">Founder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar idea"
          )}
        </Button>
      </div>
    </form>
  )
}
