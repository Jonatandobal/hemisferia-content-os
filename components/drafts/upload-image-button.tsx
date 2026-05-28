"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import imageCompression from "browser-image-compression"

interface UploadImageButtonProps {
  draftId: string
  disabled?: boolean
}

// Tope de aceptación pre-compresión (lo que el usuario puede arrastrar).
// Después comprimimos en cliente a un blob mucho más liviano.
const MAX_INPUT_SIZE = 25 * 1024 * 1024 // 25MB de entrada

// Tope del servidor (Vercel Functions Hobby = 4.5MB request body)
const MAX_OUTPUT_SIZE_MB = 3.5

export function UploadImageButton({ draftId, disabled }: UploadImageButtonProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [phase, setPhase] = useState<"compressing" | "uploading" | null>(null)

  async function handleFile(file: File) {
    // Validación cliente — solo tipo + tope absoluto de entrada
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast.error("Solo PNG, JPG o WebP")
      return
    }
    if (file.size > MAX_INPUT_SIZE) {
      toast.error("Archivo muy grande (máx 25MB de entrada)")
      return
    }

    setUploading(true)
    try {
      // 1) Comprimir en cliente si hace falta
      let outFile = file
      if (file.size > MAX_OUTPUT_SIZE_MB * 1024 * 1024) {
        setPhase("compressing")
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
        toast.info(`Comprimiendo imagen de ${sizeMB}MB...`)

        outFile = await imageCompression(file, {
          maxSizeMB: MAX_OUTPUT_SIZE_MB,
          maxWidthOrHeight: 2400, // LinkedIn nunca renderiza más de 1920px
          useWebWorker: true,
          initialQuality: 0.85,
        })

        const newMB = (outFile.size / (1024 * 1024)).toFixed(2)
        console.log(`Comprimida: ${sizeMB}MB → ${newMB}MB`)
      }

      // 2) Subir al servidor
      setPhase("uploading")
      const form = new FormData()
      form.append("file", outFile)
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
      setPhase(null)
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
        title="Subir imagen desde la PC (se comprime automático si pesa mucho)"
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            {phase === "compressing"
              ? "Comprimiendo..."
              : phase === "uploading"
                ? "Subiendo..."
                : "..."}
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
