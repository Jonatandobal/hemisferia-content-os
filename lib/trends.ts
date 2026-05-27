// Helpers para el módulo de tendencias.
// Combina Google Trends (gratis) + SerpAPI (100 reqs/mes gratis) + GPT-4o.

import { getJson } from "serpapi"
import googleTrends from "google-trends-api"

// ============================================
// Google Trends (sin key, via librería)
// ============================================
export async function getRelatedQueries(keyword: string, geo = "AR") {
  try {
    const raw = await googleTrends.relatedQueries({
      keyword,
      geo,
      hl: "es-AR",
    })
    return JSON.parse(raw)
  } catch (err) {
    console.error("Google Trends related error:", err)
    return null
  }
}

export async function getDailyTrends(geo = "AR") {
  try {
    const raw = await googleTrends.dailyTrends({ geo, hl: "es-AR" })
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
