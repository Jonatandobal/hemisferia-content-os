"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart3, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Post } from "@/lib/types"

interface MetricsFormProps {
  post: Post
}

export function MetricsForm({ post }: MetricsFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [values, setValues] = useState({
    impressions: String(post.impressions ?? ""),
    likes: String(post.likes ?? ""),
    comments: String(post.comments ?? ""),
    shares: String(post.shares ?? ""),
    dms_generated: String(post.dms_generated ?? ""),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        impressions: Number(values.impressions) || 0,
        likes: Number(values.likes) || 0,
        comments: Number(values.comments) || 0,
        shares: Number(values.shares) || 0,
        dms_generated: Number(values.dms_generated) || 0,
      }
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo actualizar")
      }
      toast.success("Métricas guardadas")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
          Métricas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cargar métricas del post</DialogTitle>
          <DialogDescription>
            Andá a tu post en LinkedIn y copiá los números que ves en analytics.
            Click en el contador para ver el desglose.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="impressions"
              label="Impresiones"
              value={values.impressions}
              onChange={(v) => setValues((s) => ({ ...s, impressions: v }))}
              disabled={busy}
            />
            <Field
              id="likes"
              label="Likes"
              value={values.likes}
              onChange={(v) => setValues((s) => ({ ...s, likes: v }))}
              disabled={busy}
            />
            <Field
              id="comments"
              label="Comentarios"
              value={values.comments}
              onChange={(v) => setValues((s) => ({ ...s, comments: v }))}
              disabled={busy}
            />
            <Field
              id="shares"
              label="Reposts"
              value={values.shares}
              onChange={(v) => setValues((s) => ({ ...s, shares: v }))}
              disabled={busy}
            />
            <Field
              id="dms_generated"
              label="DMs generados"
              value={values.dms_generated}
              onChange={(v) => setValues((s) => ({ ...s, dms_generated: v }))}
              disabled={busy}
              hint="Cuántos DMs te llegaron a partir del post"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  disabled,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="0"
      />
      {hint ? (
        <p className="text-[10px] text-muted-foreground leading-tight">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
