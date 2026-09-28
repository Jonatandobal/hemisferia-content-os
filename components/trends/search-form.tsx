"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Radar, Sparkles } from "lucide-react"
import { toast } from "sonner"

const PRESET_QUERIES = [
  "IA para PyMEs Argentina",
  "automatización procesos empresariales",
  "ChatGPT empresas argentinas",
  "WhatsApp Business automatización",
  "agentes de IA negocios",
]

export function TrendsSearchForm() {
  const router = useRouter()
  const [query, setQuery] = useState("IA para PyMEs Argentina")
  const [loading, setLoading] = useState(false)

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (query.trim().length < 3) {
      toast.error("Query muy corta")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/trends/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo buscar")
      }
      const data = await res.json()
      toast.success(`${data.trends.length} tendencias detectadas`, {
        description: "Revisalas abajo",
      })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: IA para PyMEs Argentina"
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Buscando… (~30s)
              </>
            ) : (
              <>
                <Radar />
                Buscar tendencias
              </>
            )}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Sugerencias rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuery(preset)}
                disabled={loading}
                className="text-xs h-7 px-3 rounded-full border border-border bg-background hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          Cruza <strong>Google Trends Argentina</strong> y{" "}
          <strong>Google News</strong> de los últimos días. Cada búsqueda usa 2
          de las 100 consultas gratis por mes de SerpAPI.
        </div>
    </div>
  )
}
