// Declaración de tipos custom para google-trends-api (no tiene tipos oficiales).
// Las funciones devuelven JSON stringificado — el caller hace JSON.parse.

declare module "google-trends-api" {
  interface BaseOptions {
    keyword?: string | string[]
    startTime?: Date
    endTime?: Date
    geo?: string
    hl?: string
    timezone?: number
    category?: number
    property?: string
    resolution?: string
  }

  export function autoComplete(options: BaseOptions): Promise<string>
  export function dailyTrends(options: BaseOptions): Promise<string>
  export function interestByRegion(options: BaseOptions): Promise<string>
  export function interestOverTime(options: BaseOptions): Promise<string>
  export function realTimeTrends(options: BaseOptions): Promise<string>
  export function relatedQueries(options: BaseOptions): Promise<string>
  export function relatedTopics(options: BaseOptions): Promise<string>

  // Para que `import` con namespace funcione
  const _default: {
    autoComplete: typeof autoComplete
    dailyTrends: typeof dailyTrends
    interestByRegion: typeof interestByRegion
    interestOverTime: typeof interestOverTime
    realTimeTrends: typeof realTimeTrends
    relatedQueries: typeof relatedQueries
    relatedTopics: typeof relatedTopics
  }
  export default _default
}
