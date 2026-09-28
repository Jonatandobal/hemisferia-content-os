import { Fragment } from "react"

// LinkedIn muestra ~210 caracteres antes del "…ver más".
export const LINKEDIN_FOLD = 210

function splitAtFold(text: string): [string, string] {
  if (text.length <= LINKEDIN_FOLD) return [text, ""]
  // Cortar en un espacio para no partir palabras
  let cut = text.lastIndexOf(" ", LINKEDIN_FOLD)
  if (cut < LINKEDIN_FOLD * 0.6) cut = LINKEDIN_FOLD
  return [text.slice(0, cut), text.slice(cut).replace(/^ /, "")]
}

function withPlaceholders(text: string) {
  return text.split(/(\[COMPLETAR[^\]]*\])/g).map((part, i) =>
    part.startsWith("[COMPLETAR") ? (
      <mark
        key={i}
        className="rounded bg-warning-soft px-1 py-0.5 text-warning font-medium"
      >
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

// Texto del post con el corte de "ver más" marcado y los datos a completar
// resaltados, para juzgar el gancho como lo va a ver el lector.
export function PostText({ content }: { content: string }) {
  const [visible, hidden] = splitAtFold(content)
  return (
    <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
      <div>{withPlaceholders(visible)}</div>
      {hidden ? (
        <>
          <div
            className="my-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none"
            aria-hidden
          >
            <span className="h-px flex-1 border-t border-dashed border-border" />
            corte de &quot;ver más&quot;
            <span className="h-px flex-1 border-t border-dashed border-border" />
          </div>
          <div className="text-foreground/85">{withPlaceholders(hidden)}</div>
        </>
      ) : null}
    </div>
  )
}
