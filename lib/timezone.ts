// Zona horaria de negocio. Vercel corre en UTC, así que todo lo que sea
// "hoy" o "a qué hora" para el usuario se calcula explícitamente acá.

export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires"

// Offset de la zona para una fecha dada, ej: "-03:00".
function offsetFor(date: Date, timeZone: string): string {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT"
  return name.match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? "+00:00"
}

// Inicio (inclusive) y fin (exclusivo) del día calendario de `date` en la zona.
export function dayRangeInTimeZone(date: Date, timeZone = APP_TIME_ZONE) {
  // en-CA formatea como YYYY-MM-DD
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
  const start = new Date(`${day}T00:00:00${offsetFor(date, timeZone)}`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

// "14:30"
export function formatTime(date: Date, timeZone = APP_TIME_ZONE) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date)
}

// "lunes, 28 de septiembre"
export function formatLongDate(date: Date, timeZone = APP_TIME_ZONE) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
}
