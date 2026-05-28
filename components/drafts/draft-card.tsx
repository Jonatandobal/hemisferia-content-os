"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Sparkles,
  ImageIcon,
  RefreshCw,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { Draft } from "@/lib/types"
import { UploadImageButton } from "./upload-image-button"
import { LinkedInPreview } from "./linkedin-preview"

interface DraftCardProps {
  draft: Draft
}

export function DraftCard({ draft }: DraftCardProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<
    null | "approve" | "reject" | "copy" | "image"
  >(null)
  const [copied, setCopied] = useState(false)

  async function updateStatus(status: "approved" | "rejected") {
    setBusy(status === "approved" ? "approve" : "reject")
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("No se pudo actualizar")
      toast.success(status === "approved" ? "Draft aprobado" : "Draft descartado")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setBusy(null)
    }
  }

  async function handleCopy() {
    setBusy("copy")
    try {
      await navigator.clipboard.writeText(draft.content)
      setCopied(true)
      toast.success("Copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar")
    } finally {
      setBusy(null)
    }
  }

  async function handleGenerateImage() {
    setBusy("image")
    try {
      const res = await fetch(`/api/drafts/${draft.id}/image`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo generar")
      }
      toast.success("Imagen generada ✨")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setBusy(null)
    }
  }

  const variantLabel = ["Caso real", "Contrarian", "Educativo"][draft.variant - 1] ?? `V${draft.variant}`
  const isPending = draft.status === "draft"
  const isApproved = draft.status === "approved"
  const isRejected = draft.status === "rejected"

  return (
    <Card
      className={
        isRejected
          ? "opacity-50"
          : isApproved
            ? "border-emerald-500/50"
            : ""
      }
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Variante {draft.variant} · {variantLabel}
            </span>
          </div>
          <Badge
            variant={isApproved ? "default" : "outline"}
            className="text-xs"
          >
            {draft.status}
          </Badge>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/40 rounded-md p-3 border">
          {draft.content}
        </div>

        {/* Imagen generada por DALL-E si existe */}
        {draft.image_url ? (
          <div className="space-y-2">
            <div className="relative aspect-[16/9] rounded-md overflow-hidden border bg-muted">
              <Image
                src={draft.image_url}
                alt="Imagen generada para el post"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
                unoptimized // URLs de DALL-E expiran en 60min y no son CDN-optimizables
              />
            </div>
            {draft.image_prompt ? (
              <p className="text-[10px] text-muted-foreground italic line-clamp-2">
                Prompt: {draft.image_prompt}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(draft.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateImage}
              disabled={busy !== null}
              title={
                draft.image_url
                  ? "Regenerar imagen"
                  : "Generar imagen con IA"
              }
            >
              {busy === "image" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generando...
                </>
              ) : draft.image_url ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Nueva imagen
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                  Imagen IA
                </>
              )}
            </Button>

            <UploadImageButton
              draftId={draft.id}
              disabled={busy !== null}
            />

            <LinkedInPreview draft={draft} />

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={busy !== null}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copiar
                </>
              )}
            </Button>

            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatus("rejected")}
                  disabled={busy !== null}
                >
                  {busy === "reject" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ThumbsDown className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => updateStatus("approved")}
                  disabled={busy !== null}
                >
                  {busy === "approve" ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Aprobar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
