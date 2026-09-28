// Normaliza el texto de un post para pegarlo en LinkedIn.
// LinkedIn no renderiza markdown: "**Resultado:**" se ve con asteriscos.

export function toLinkedInText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// Datos que el modelo no tenía y dejó para completar a mano.
const PLACEHOLDER = /\[COMPLETAR[^\]]*\]/g

export function findPlaceholders(text: string): string[] {
  return text.match(PLACEHOLDER) ?? []
}

// Primera y última línea con texto: sirven para que el modelo no repita
// ganchos ni cierres de posts anteriores.
export function hookAndClosing(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  return { hook: lines[0] ?? "", closing: lines.at(-1) ?? "" }
}
