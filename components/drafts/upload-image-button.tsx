"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface UploadImageButtonProps {
  draftId: string
  disabled?: boolean
}

export function UploadImageButton({ draftId, disabled }: UploadImageButtonProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    // Validación cliente
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Archivo muy grande (máx 5MB)")
      return
    }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast.error("Solo PNG, JPG o WebP")
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/drafts/${draftId}/upload`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo subir")
      }
      toast.success("Imagen subida ✅")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        title="Subir imagen desde la PC"
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Subir
          </>
        )}
      </Button>
    </>
  )
}
