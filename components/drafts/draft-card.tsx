"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { Draft } from "@/lib/types"

interface DraftCardProps {
  draft: Draft
}

export function DraftCard({ draft }: DraftCardProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | "approve" | "reject" | "copy">(null)
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

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(draft.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>

          <div className="flex items-center gap-2">
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
