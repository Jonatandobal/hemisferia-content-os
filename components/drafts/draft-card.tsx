"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarDays,
  Check,
  Copy,
  ImageIcon,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DraftStatusBadge, PillarBadge } from "@/components/common/badges"
import { type Draft, draftTemplate } from "@/lib/types"
import { findPlaceholders } from "@/lib/post-format"
import { LINKEDIN_FOLD, PostText } from "./post-text"
import { UploadImageButton } from "./upload-image-button"
import { LinkedInPreview } from "./linkedin-preview"
import { PostNowButton } from "./post-now-button"

const LINKEDIN_MAX = 3000

interface DraftCardProps {
  draft: Draft
  // Contexto de la idea cuando la card se muestra fuera de su grupo
  ideaText?: string
  focused?: boolean
}

type Busy = null | "approve" | "reject" | "restore" | "image" | "save"

export function DraftCard({ draft, ideaText, focused }: DraftCardProps) {
  const router = useRouter()
  const ref = useRef<HTMLElement>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(draft.content)

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [focused])

  async function patch(body: Record<string, unknown>, kind: Busy, ok: string) {
    setBusy(kind)
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar")
      toast.success(ok)
      if (data.publora?.message) toast.warning(data.publora.message)
      router.refresh()
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
      return false
    } finally {
      setBusy(null)
    }
  }

  function startEdit() {
    setText(draft.content)
    setEditing(true)
  }

  async function saveText() {
    if (text.trim().length < 10) {
      toast.error("El post quedó demasiado corto")
      return
    }
    if (await patch({ content: text.trim() }, "save", "Cambios guardados")) {
      setEditing(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft.content)
      setCopied(true)
      toast.success("Texto copiado")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  async function handleGenerateImage() {
    setBusy("image")
    try {
      const res = await fetch(`/api/drafts/${draft.id}/image`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "No se pudo generar")
      toast.success("Imagen lista")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setBusy(null)
    }
  }

  const template = draftTemplate(draft)
  const placeholders = findPlaceholders(draft.content)
  const isPending = draft.status === "draft"
  const isApproved = draft.status === "approved"
  const isRejected = draft.status === "rejected"
  const isPublished = draft.status === "published"
  const isScheduled = isApproved && !!draft.scheduled_for
  const autoPublish = draft.publora_status === "scheduled"
  const canEdit = !isPublished && !autoPublish
  const canTouchImage = !isRejected && !isPublished

  return (
    <article
      ref={ref}
      id={`draft-${draft.id}`}
      className={cn(
        "rounded-2xl border bg-card transition-shadow",
        focused ? "border-primary ring-4 ring-primary/10" : "border-border",
        isRejected && "opacity-60",
      )}
    >
      {/* Encabezado */}
      <div className="flex items-center gap-2 flex-wrap px-4 pt-4 md:px-5">
        <PillarBadge pillar={template} />
        <DraftStatusBadge status={draft.status} scheduled={isScheduled} />
        <span className="text-xs text-muted-foreground ml-auto">
          Variante {draft.variant} ·{" "}
          {formatDistanceToNow(new Date(draft.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </span>
      </div>

      {ideaText ? (
        <p className="px-4 md:px-5 pt-2 text-xs text-muted-foreground line-clamp-1">
          Idea: {ideaText}
        </p>
      ) : null}

      {/* Texto */}
      <div className="px-4 py-4 md:px-5">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              autoFocus
              className="text-[15px] leading-relaxed"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p
                className={cn(
                  "text-xs tabular-nums",
                  text.length > LINKEDIN_MAX ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {text.length.toLocaleString("es-AR")} / {LINKEDIN_MAX.toLocaleString("es-AR")} caracteres ·
                los primeros {LINKEDIN_FOLD} se ven antes de &quot;ver más&quot;
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setText(draft.content)
                    setEditing(false)
                  }}
                  disabled={busy === "save"}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={saveText}
                  disabled={busy === "save" || text.length > LINKEDIN_MAX}
                >
                  {busy === "save" ? <Loader2 className="animate-spin" /> : <Check />}
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <PostText content={draft.content} />
        )}
      </div>

      {/* Avisos */}
      {!editing && (placeholders.length > 0 || autoPublish || draft.publora_error) ? (
        <div className="px-4 md:px-5 pb-4 space-y-2">
          {placeholders.length > 0 && !isRejected ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
              <span>
                {placeholders.length === 1
                  ? "Falta 1 dato real"
                  : `Faltan ${placeholders.length} datos reales`}{" "}
                antes de publicar.
              </span>
              {canEdit ? (
                <Button size="sm" variant="outline" onClick={startEdit}>
                  <Pencil />
                  Completar
                </Button>
              ) : null}
            </div>
          ) : null}
          {autoPublish && draft.scheduled_for ? (
            <div className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm text-success">
              <Send className="w-4 h-4 shrink-0" />
              Se publica solo el{" "}
              {format(new Date(draft.scheduled_for), "EEEE d 'de' MMMM, HH:mm 'hs'", { locale: es })}
            </div>
          ) : draft.publora_error ? (
            <div className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
              {draft.publora_error}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Imagen */}
      {draft.image_url ? (
        <div className="px-4 md:px-5 pb-4">
          <div className="group relative aspect-[1.91/1] overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={draft.image_url}
              alt="Imagen del post"
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
              unoptimized // Se sirve directo desde Supabase Storage
            />
            {canTouchImage ? (
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary" onClick={handleGenerateImage} disabled={busy !== null}>
                  {busy === "image" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  Otra con IA
                </Button>
                <UploadImageButton draftId={draft.id} disabled={busy !== null} label="Reemplazar" />
              </div>
            ) : null}
          </div>
        </div>
      ) : canTouchImage ? (
        <div className="mx-4 md:mx-5 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-border px-3 py-2.5">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="w-4 h-4" />
            Imagen (opcional)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleGenerateImage} disabled={busy !== null}>
              {busy === "image" ? <Loader2 className="animate-spin" /> : <ImageIcon />}
              {busy === "image" ? "Generando…" : "Generar con IA"}
            </Button>
            <UploadImageButton draftId={draft.id} disabled={busy !== null} />
          </div>
        </div>
      ) : null}

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5 md:px-4">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <LinkedInPreview draft={draft} />
          {canEdit && !editing ? (
            <Button size="sm" variant="ghost" onClick={startEdit}>
              <Pencil />
              Editar
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {isPending ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => patch({ status: "rejected" }, "reject", "Draft descartado")}
                disabled={busy !== null}
              >
                {busy === "reject" ? <Loader2 className="animate-spin" /> : <ThumbsDown />}
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={() => patch({ status: "approved" }, "approve", "Aprobado. Ahora elegile un día.")}
                disabled={busy !== null}
              >
                {busy === "approve" ? <Loader2 className="animate-spin" /> : <ThumbsUp />}
                Aprobar
              </Button>
            </>
          ) : null}

          {isApproved ? (
            <>
              <Button asChild size="sm" variant="outline">
                <Link href={`/calendar?draft=${draft.id}`}>
                  <CalendarDays />
                  {isScheduled
                    ? format(new Date(draft.scheduled_for!), "EEE d MMM, HH:mm", { locale: es })
                    : "Programar"}
                </Link>
              </Button>
              {!autoPublish ? <PostNowButton draft={draft} /> : null}
            </>
          ) : null}

          {isRejected ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => patch({ status: "draft" }, "restore", "Draft recuperado")}
              disabled={busy !== null}
            >
              {busy === "restore" ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              Recuperar
            </Button>
          ) : null}

          {isPublished ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/analytics">Ver métricas</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
