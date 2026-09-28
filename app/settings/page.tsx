import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { listConnections, type PubloraConnection } from "@/lib/publora"

export const dynamic = "force-dynamic"

async function getPubloraState() {
  const hasKey = Boolean(process.env.PUBLORA_API_KEY)
  const platformId = process.env.PUBLORA_LINKEDIN_PLATFORM_ID ?? null
  if (!hasKey) {
    return { hasKey, platformId, connections: [], error: null }
  }
  try {
    const connections = await listConnections()
    return { hasKey, platformId, connections, error: null }
  } catch (err) {
    return {
      hasKey,
      platformId,
      connections: [] as PubloraConnection[],
      error: err instanceof Error ? err.message : "Error consultando Publora",
    }
  }
}

export default async function SettingsPage() {
  const publora = await getPubloraState()
  const linkedinConnections = publora.connections.filter((c) =>
    c.platformId?.startsWith("linkedin"),
  )
  const platformMatches = linkedinConnections.some(
    (c) => c.platformId === publora.platformId,
  )
  const ready = publora.hasKey && platformMatches

  return (
    <DashboardShell>
      <Header
        title="Configuración"
        description="Integraciones del sistema"
      />
      <PageBody width="narrow">
        <div className="space-y-4">
          <Card className="rounded-2xl ring-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                Publora — publicación automática en LinkedIn
              </CardTitle>
              <Badge variant={ready ? "default" : "outline"}>
                {ready ? "Activo" : "Sin configurar"}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p className="text-muted-foreground">
                Cuando está activo, programar un draft en el calendario lo
                programa también en LinkedIn y se publica solo a esa hora.
              </p>

              <ul className="space-y-1">
                <li>
                  {publora.hasKey ? "✅" : "❌"} <code>PUBLORA_API_KEY</code>
                </li>
                <li>
                  {platformMatches ? "✅" : "❌"}{" "}
                  <code>PUBLORA_LINKEDIN_PLATFORM_ID</code>
                  {publora.platformId ? (
                    <span className="text-muted-foreground">
                      {" "}
                      = {publora.platformId}
                      {!platformMatches && publora.connections.length > 0
                        ? " (no coincide con ninguna cuenta conectada)"
                        : ""}
                    </span>
                  ) : null}
                </li>
              </ul>

              {publora.error ? (
                <p className="text-amber-600 dark:text-amber-400">
                  ⚠️ {publora.error}
                </p>
              ) : null}

              {linkedinConnections.length > 0 ? (
                <div className="space-y-1">
                  <p className="font-medium">Cuentas de LinkedIn en Publora</p>
                  {linkedinConnections.map((c) => (
                    <p key={c.platformId} className="text-muted-foreground">
                      <code className="text-foreground">{c.platformId}</code>
                      {c.displayName || c.username
                        ? ` — ${c.displayName ?? c.username}`
                        : ""}
                    </p>
                  ))}
                  {!platformMatches ? (
                    <p className="text-xs text-muted-foreground">
                      Copiá el id de tu cuenta a{" "}
                      <code>PUBLORA_LINKEDIN_PLATFORM_ID</code> en Vercel y
                      redeployá.
                    </p>
                  ) : null}
                </div>
              ) : publora.hasKey && !publora.error ? (
                <p className="text-muted-foreground">
                  No hay cuentas de LinkedIn conectadas en Publora. Conectala
                  desde el panel de Publora.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </DashboardShell>
  )
}
