"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  MoreHorizontal,
  Globe,
} from "lucide-react"
import type { Draft } from "@/lib/types"

interface LinkedInPreviewProps {
  draft: Draft
}

// Si tu post es largo, LinkedIn trunca a ~210 caracteres y muestra "...ver más".
// Esta función simula eso.
function truncatePreview(content: string, max = 210) {
  if (content.length <= max) return { short: content, hasMore: false }
  return { short: content.slice(0, max), hasMore: true }
}

export function LinkedInPreview({ draft }: LinkedInPreviewProps) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { short, hasMore } = truncatePreview(draft.content)
  const displayed = expanded || !hasMore ? draft.content : short

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title="Preview tipo LinkedIn">
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-sm">
            Vista previa — así se va a ver en LinkedIn
          </DialogTitle>
        </DialogHeader>

        {/* Mock feed de LinkedIn */}
        <div className="bg-[#F4F2EE] p-4 max-h-[70vh] overflow-y-auto">
          <article className="bg-white rounded-lg shadow-sm border border-black/5 overflow-hidden">
            {/* Header del post */}
            <div className="px-4 pt-3 pb-2 flex items-start justify-between">
              <div className="flex items-start gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                  J
                </div>
                <div className="leading-tight">
                  <div className="font-semibold text-[14px] text-[#000000E6] hover:text-[#0a66c2] hover:underline cursor-pointer">
                    Jonatan Dobal
                  </div>
                  <div className="text-[12px] text-[#00000099] leading-tight">
                    Fundador @ Hemisferia · Automatización e IA para PyMEs
                  </div>
                  <div className="text-[12px] text-[#00000099] flex items-center gap-1 leading-tight mt-0.5">
                    <span>Ahora</span>
                    <span>·</span>
                    <Globe className="w-3 h-3" />
                  </div>
                </div>
              </div>
              <button className="text-[#00000099] hover:bg-black/5 rounded-full p-1">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Texto del post */}
            <div className="px-4 pb-2 text-[14px] text-[#000000E6] leading-[1.45] whitespace-pre-wrap">
              {displayed}
              {hasMore && !expanded ? (
                <>
                  …{" "}
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-[#00000099] hover:text-[#0a66c2] hover:underline font-normal"
                  >
                    ver más
                  </button>
                </>
              ) : null}
            </div>

            {/* Imagen si existe */}
            {draft.image_url ? (
              <div className="relative w-full aspect-[1.91/1] bg-black/5">
                <Image
                  src={draft.image_url}
                  alt="Imagen del post"
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}

            {/* Métricas placeholder */}
            <div className="px-4 py-2 flex items-center justify-between text-[12px] text-[#00000099] border-t border-black/5 mt-1">
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-[#0a66c2] border border-white flex items-center justify-center">
                    <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                  </div>
                  <div className="w-4 h-4 rounded-full bg-[#df704d] border border-white" />
                  <div className="w-4 h-4 rounded-full bg-[#f5bb54] border border-white" />
                </div>
                <span className="ml-1 hover:text-[#0a66c2] hover:underline cursor-pointer">
                  124
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hover:text-[#0a66c2] hover:underline cursor-pointer">
                  18 comentarios
                </span>
                <span>·</span>
                <span className="hover:text-[#0a66c2] hover:underline cursor-pointer">
                  3 reposts
                </span>
              </div>
            </div>

            {/* Botonera */}
            <div className="px-2 py-1 grid grid-cols-4 border-t border-black/10">
              <ActionBtn icon={ThumbsUp} label="Recomendar" />
              <ActionBtn icon={MessageSquare} label="Comentar" />
              <ActionBtn icon={Repeat2} label="Compartir" />
              <ActionBtn icon={Send} label="Enviar" />
            </div>
          </article>

          {/* Nota informativa */}
          <p className="text-[11px] text-muted-foreground text-center mt-3 px-2 leading-relaxed">
            Las métricas son placeholder (124 likes, 18 comments). Lo real va a
            depender del horario, hook y engagement de tu red.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ActionBtn({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button className="flex items-center justify-center gap-2 px-3 py-2 hover:bg-black/5 rounded transition-colors text-[#00000099] text-[13px] font-semibold">
      <Icon className="w-5 h-5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
