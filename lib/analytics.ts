// Helpers para calcular métricas de analytics de posts publicados.

import type { Pillar, Post } from "@/lib/types"

export interface PostWithDraft extends Post {
  draft?: {
    id: string
    variant: number
    idea?: {
      pillar: Pillar | null
    } | null
  } | null
}

export interface PillarStats {
  pillar: Pillar | "sin_pilar"
  count: number
  total_impressions: number
  total_likes: number
  total_comments: number
  total_shares: number
  total_dms: number
  avg_engagement_rate: number
}

const PILLARS: (Pillar | "sin_pilar")[] = [
  "caso",
  "contrarian",
  "educativo",
  "founder",
  "sin_pilar",
]

export function computeStatsByPillar(posts: PostWithDraft[]): PillarStats[] {
  const map = new Map<Pillar | "sin_pilar", PillarStats>()

  for (const p of PILLARS) {
    map.set(p, {
      pillar: p,
      count: 0,
      total_impressions: 0,
      total_likes: 0,
      total_comments: 0,
      total_shares: 0,
      total_dms: 0,
      avg_engagement_rate: 0,
    })
  }

  for (const post of posts) {
    const pillar = post.draft?.idea?.pillar ?? "sin_pilar"
    const stats = map.get(pillar)!
    stats.count += 1
    stats.total_impressions += post.impressions ?? 0
    stats.total_likes += post.likes ?? 0
    stats.total_comments += post.comments ?? 0
    stats.total_shares += post.shares ?? 0
    stats.total_dms += post.dms_generated ?? 0
  }

  // Engagement rate = (likes + comments + shares) / impressions
  for (const stats of map.values()) {
    if (stats.total_impressions > 0) {
      stats.avg_engagement_rate =
        (stats.total_likes + stats.total_comments + stats.total_shares) /
        stats.total_impressions
    }
  }

  return Array.from(map.values()).filter((s) => s.count > 0)
}

export function computeOverallStats(posts: PostWithDraft[]) {
  let impressions = 0
  let likes = 0
  let comments = 0
  let shares = 0
  let dms = 0

  for (const p of posts) {
    impressions += p.impressions ?? 0
    likes += p.likes ?? 0
    comments += p.comments ?? 0
    shares += p.shares ?? 0
    dms += p.dms_generated ?? 0
  }

  const engagementRate =
    impressions > 0 ? (likes + comments + shares) / impressions : 0

  return {
    total_posts: posts.length,
    total_impressions: impressions,
    total_likes: likes,
    total_comments: comments,
    total_shares: shares,
    total_dms: dms,
    engagement_rate: engagementRate,
  }
}

export function topPostsByScore(
  posts: PostWithDraft[],
  n = 5,
): PostWithDraft[] {
  // Score combinado: likes + 3*comments + 5*shares + 10*dms
  return [...posts]
    .map((p) => ({
      ...p,
      _score:
        (p.likes ?? 0) +
        (p.comments ?? 0) * 3 +
        (p.shares ?? 0) * 5 +
        (p.dms_generated ?? 0) * 10,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, n)
}
