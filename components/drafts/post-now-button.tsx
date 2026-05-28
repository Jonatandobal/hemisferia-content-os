"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, Check, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Draft } from "@/lib/types"

interface PostNowButtonProps {
  draft: Draft
}

export function PostNowButton({ draft }: PostNowButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [busy, setBusy] = useState(false)
  const [linkedinUrl, setLinkedinUrl] = useState("")

  async function handleCopyAndOpen() {
    setBusy(true)
    try {
      // 1. Copiar al portapapeles
      await navigator.clipboard.writeText(draft.content)
      toast.success("Texto copiado al portapapeles")

      // 2. Abrir LinkedIn en nueva pestaña
      window.open(
        "https://www.linkedin.com/feed/?shareActive=true",
        "_blank",
        "noopener,noreferrer",
      )

      // 3. Avanzar al paso 2
      setStep(2)
    } catch {
      toast.error("No se pudo copiar")
    } finally {
      setBusy(false)
    }
  }

  async function handleMarkPublished() {
    setBusy(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: draft.id,
          linkedin_url: linkedinUrl.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo registrar")
      }
      toast.success("Post registrado 🎉", {
        description: "Lo vas a ver en Analytics",
      })
      setOpen(false)
      setStep(1)
      setLinkedinUrl("")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setStep(1)
          setLinkedinUrl("")
        }
      }}
    >
      <Button size="sm" onClick={() => setOpen(true)}>
        <Send className="w-3.5 h-3.5 mr-1.5" />
        Postear
      </Button>

      <DialogContent className="max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Postear en LinkedIn — 2 pasos</DialogTitle>
              <DialogDescription>
                Sistema rápido: copio el texto al portapapeles y abro LinkedIn.
                Vos pegás (Cmd+V), adjuntás la imagen si querés, y publicás.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="text-sm bg-muted/50 rounded-md p-3 border max-h-40 overflow-y-auto whitespace-pre-wrap">
                {draft.content}
              </div>
              {draft.image_url ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  El draft tiene imagen — descargala antes de pegar el texto
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ⚠️ Este draft no tiene imagen. Generala o subila antes si
                  querés que el post tenga.
                </p>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCopyAndOpen}
                disabled={busy}
                className="w-full sm:w-auto"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Copiar y abrir LinkedIn
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>¿Ya publicaste?</DialogTitle>
              <DialogDescription>
                Cuando termines de pegar y publicar en LinkedIn, volvé acá y
                marcá como publicado. Si pegás la URL del post, después podés
                cargar métricas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="linkedin-url" className="text-sm">
                  URL del post en LinkedIn (opcional)
                </Label>
                <Input
                  id="linkedin-url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/posts/..."
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground">
                  Después de publicar, click "..." en tu post → "Copiar link" →
                  pegalo acá.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={busy}
                className="w-full sm:w-auto"
              >
                Volver
              </Button>
              <Button
                onClick={handleMarkPublished}
                disabled={busy}
                className="w-full sm:w-auto"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Marcar como publicado
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
