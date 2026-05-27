// Helpers para el módulo de tendencias.
// Combina Google Trends (gratis) + SerpAPI (100 reqs/mes gratis) + GPT-4o.

import { getJson } from "serpapi"

// ============================================
// Google Trends (sin key, via librería)
// ============================================
// La librería no tiene tipos, lo importamos como any.
type GoogleTrendsClient = {
  relatedQueries: (opts: {
    keyword: string
    geo?: string
    hl?: string
  }) => Promise<string>
  dailyTrends: (opts: { geo?: string; hl?: string }) => Promise<string>
}

export async function getRelatedQueries(keyword: string, geo = "AR") {
  // Import dinámico — la librería es CommonJS sin tipos.
  const trends = (await import("google-trends-api")) as unknown as GoogleTrendsClient
  try {
    const raw = await trends.relatedQueries({ keyword, geo, hl: "es-AR" })
    return JSON.parse(raw)
  } catch (err) {
    console.error("Google Trends related error:", err)
    return null
  }
}

export async function getDailyTrends(geo = "AR") {
  const trends = (await import("google-trends-api")) as unknown as GoogleTrendsClient
  try {
    const raw = await trends.dailyTrends({ geo, hl: "es-AR" })
    return JSON.parse(raw)
  } catch (err) {
    console.error("Google Trends daily error:", err)
    return null
  }
}

// ============================================
// SerpAPI — Google News últimos 7 días
// ============================================
export async function getRecentNews(query: string) {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) {
    throw new Error("Falta SERPAPI_KEY en env vars")
  }

  try {
    const data = await getJson({
      engine: "google_news",
      q: query,
      gl: "ar", // Argentina
      hl: "es", // español
      api_key: apiKey,
    })

    // Limitamos a primeros 10 resultados para no inflar el prompt
    const articles =
      (data.news_results ?? [])
        .slice(0, 10)
        .map((r: Record<string, unknown>) => ({
          title: r.title,
          link: r.link,
          source: (r.source as Record<string, unknown>)?.name,
          date: r.date,
          snippet: r.snippet ?? "",
        })) ?? []

    return articles
  } catch (err) {
    console.error("SerpAPI error:", err)
    return []
  }
}
