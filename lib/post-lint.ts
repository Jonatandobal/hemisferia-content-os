// Revisión automática y determinística de un post contra las reglas del
// prompt (lib/prompts.ts). No usa IA: son chequeos de texto simples que
// corren gratis en cada render, así que nunca quedan desactualizados
// después de una edición manual.
//
// El objetivo es agarrar antes de publicar lo que rompe el sistema (un
// gancho que es pregunta, markdown que quedó pegado, un post carísimo de
// largo) sin bloquear nada — son avisos, no un candado.

export type LintSeverity = "error" | "warning"

export interface LintIssue {
  id: string
  severity: LintSeverity
  message: string
}

const LINKEDIN_MAX = 3000
const SOFT_MIN = 500
const SOFT_MAX = 1700

// Frases que el prompt prohíbe explícitamente por sonar a IA o ser
// cierres genéricos. Case-insensitive, sin acentos para tolerar variantes.
const BANNED_PHRASES = [
  "el resultado?",
  "el resultado:",
  "plot twist",
  "spoiler",
  "te cuento cómo",
  "la clave:",
  "no es x, es y",
  "dejá de x",
  "te voy a ser honesto",
  "seamos sinceros",
  "en el mundo actual",
  "la era digital",
  "transformación digital",
  "revolucionar",
  "disrumpir",
  "sinergia",
  "ecosistema",
  "paradigma",
  "romper el chanchito",
  "varita mágica",
  "¿qué opinás?",
  "¿qué pensás vos?",
  "¿te pasó algo parecido?",
  "etiquetá a alguien",
  "tag someone",
]

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

export function lintPost(content: string): LintIssue[] {
  const issues: LintIssue[] = []
  const trimmed = content.trim()
  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean)
  const hook = lines[0] ?? ""

  // Gancho
  if (hook.endsWith("?")) {
    issues.push({
      id: "hook_is_question",
      severity: "error",
      message: "El gancho (línea 1) es una pregunta. La regla pide una afirmación o un dato.",
    })
  }
  const hookWords = hook.split(/\s+/).filter(Boolean).length
  if (hookWords > 14) {
    issues.push({
      id: "hook_too_long",
      severity: "warning",
      message: `El gancho tiene ${hookWords} palabras. Apuntá a 12 o menos.`,
    })
  }
  if (lines[1] && normalize(lines[1]).startsWith(normalize(hook).slice(0, 20))) {
    issues.push({
      id: "hook_repeated",
      severity: "warning",
      message: "La línea 2 repite el gancho en vez de continuarlo.",
    })
  }

  // Largo
  if (trimmed.length > LINKEDIN_MAX) {
    issues.push({
      id: "too_long_hard",
      severity: "error",
      message: `Supera el límite de LinkedIn (${trimmed.length}/${LINKEDIN_MAX} caracteres).`,
    })
  } else if (trimmed.length < SOFT_MIN || trimmed.length > SOFT_MAX) {
    issues.push({
      id: "length_out_of_range",
      severity: "warning",
      message: `${trimmed.length} caracteres — el rango recomendado es 900-1300.`,
    })
  }

  // Markdown que se haya colado (por ejemplo, en una edición manual)
  if (/\*\*[^*]+\*\*/.test(trimmed) || /^#{1,6}\s/m.test(trimmed)) {
    issues.push({
      id: "has_markdown",
      severity: "error",
      message: "Tiene markdown (**negrita** o #título) que LinkedIn muestra tal cual.",
    })
  }

  // Links en el cuerpo (deberían ir en el primer comentario)
  if (/https?:\/\/\S+/.test(trimmed)) {
    issues.push({
      id: "has_link",
      severity: "warning",
      message: "Tiene un link en el cuerpo. LinkedIn penaliza el alcance — movelo al primer comentario.",
    })
  }

  // Frases prohibidas / clichés de IA
  const normalized = normalize(trimmed)
  const found = BANNED_PHRASES.filter((p) => normalized.includes(normalize(p)))
  if (found.length > 0) {
    issues.push({
      id: "banned_phrase",
      severity: "warning",
      message: `Frase que suena a IA o cierre genérico: "${found[0]}"${found.length > 1 ? ` (+${found.length - 1} más)` : ""}.`,
    })
  }

  // Densidad de guiones largos (regla: ~1 cada 100 palabras)
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length || 1
  const emDashes = (trimmed.match(/—/g) ?? []).length
  if (emDashes / wordCount > 0.02) {
    issues.push({
      id: "em_dash_density",
      severity: "warning",
      message: `${emDashes} guiones largos para ${wordCount} palabras — se nota mecánico.`,
    })
  }

  return issues
}

export function hasBlockingIssues(issues: LintIssue[]) {
  return issues.some((i) => i.severity === "error")
}
