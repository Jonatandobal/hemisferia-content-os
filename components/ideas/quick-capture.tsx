"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PillarPicker } from "./pillar-picker"
import type { Pillar } from "@/lib/types"

// Captura rápida: una idea en dos segundos, sin salir de la página.
export function QuickCapture({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [pillar, setPillar] = useState<Pillar | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (text.trim().length < 3) {
      toast.error("Escribí al menos unas palabras")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text, pillar, source: "web" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo guardar")
      }
      toast.success("Idea guardada")
      setText("")
      setPillar(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save()
        }}
        placeholder="¿Qué pasó hoy que valga un post? Un cliente, una opinión, algo que aprendiste…"
        rows={compact ? 2 : 3}
        disabled={saving}
        className="resize-none border-0 bg-transparent p-0 text-[15px] shadow-none focus-visible:ring-0"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <PillarPicker value={pillar} onChange={setPillar} size="sm" />
        <div className="flex items-center gap-2 ml-auto">
          <Button asChild variant="ghost" size="sm">
            <Link href="/ideas/new">Con más detalle</Link>
          </Button>
          <Button size="sm" onClick={save} disabled={saving || !text.trim()}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Guardar idea
          </Button>
        </div>
      </div>
    </div>
  )
}
