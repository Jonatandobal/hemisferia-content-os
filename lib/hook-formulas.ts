// Fórmulas de gancho (línea 1) para forzar variedad real entre las 3
// variantes de un mismo post. Sin esto, el modelo tiende a abrir las tres
// con la misma estructura ("El otro día...") y solo cambia el tema.
//
// Cada fórmula es una forma de abrir, no un tema. Todas respetan la regla
// general: afirmación o dato, nunca una pregunta.

export type HookFormula =
  | "dato_exacto"
  | "escena"
  | "cita_ajena"
  | "contraste"
  | "confesion"
  | "pregunta_recibida"

export const HOOK_FORMULAS: Record<HookFormula, { label: string; rule: string; example: string }> = {
  dato_exacto: {
    label: "Dato exacto primero",
    rule: "Arrancá con el número o el dato más concreto del post, sin rodeos.",
    example: "80 pedidos por día cargados a mano, uno por uno.",
  },
  escena: {
    label: "Escena concreta",
    rule: "Arrancá parado en un momento puntual: dónde estabas, qué viste.",
    example: "Llegué a la reunión y el dueño no me miraba.",
  },
  cita_ajena: {
    label: "Cita de otra persona",
    rule: "Arrancá con algo textual que te dijo un cliente o alguien, entre comillas.",
    example: '"Necesitamos IA ya", me dijo un cliente el lunes.',
  },
  contraste: {
    label: "Antes / después",
    rule: "Arrancá mostrando el cambio: cómo era antes y cómo es ahora, en una sola línea.",
    example: "Tres personas tipeando pedidos. Hoy, cero.",
  },
  confesion: {
    label: "Admisión honesta",
    rule: "Arrancá reconociendo un error propio o algo que pensabas distinto antes.",
    example: "Le dije que sí a un proyecto que no entendía.",
  },
  pregunta_recibida: {
    label: "Pregunta que te hicieron",
    rule: "Contá qué te preguntaron (en pasado, como narración) — la línea 1 no termina en '?'.",
    example: "Me preguntaron tres veces esta semana qué es un agente de IA.",
  },
}

export const HOOK_FORMULA_IDS = Object.keys(HOOK_FORMULAS) as HookFormula[]

export function hookFormulasPromptBlock() {
  return HOOK_FORMULA_IDS.map(
    (id) => `- ${id}: ${HOOK_FORMULAS[id].rule}\n  Ej: "${HOOK_FORMULAS[id].example}"`,
  ).join("\n")
}
