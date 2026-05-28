// Template de email diario con los drafts programados para hoy.
// Renderiza con @react-email/components y se envía vía Resend.

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DraftPreview {
  id: string
  variant: number
  content: string
  scheduled_for: string | null
  image_url: string | null
}

interface DailyReminderEmailProps {
  appUrl: string
  date: Date
  drafts: DraftPreview[]
}

export default function DailyReminderEmail({
  appUrl,
  date,
  drafts,
}: DailyReminderEmailProps) {
  const dateLabel = format(date, "EEEE d 'de' MMMM", { locale: es })
  const variantLabels = ["Caso real", "Contrarian", "Educativo", "Founder"]
  const previewText = `Tenés ${drafts.length} ${drafts.length === 1 ? "post" : "posts"} para publicar hoy`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-8 px-4 max-w-xl">
            <Section className="bg-white rounded-lg p-6 border border-gray-200">
              <Heading className="text-xl font-bold text-gray-900 m-0 mb-1">
                Hora de publicar 📢
              </Heading>
              <Text className="text-sm text-gray-500 m-0 mb-6 capitalize">
                {dateLabel}
              </Text>

              <Text className="text-sm text-gray-700 m-0 mb-4 leading-relaxed">
                Tenés <strong>{drafts.length}</strong>{" "}
                {drafts.length === 1 ? "post programado" : "posts programados"}{" "}
                para hoy. Click en el botón debajo de cada uno para postearlo en
                menos de 10 segundos.
              </Text>

              <Hr className="my-6 border-gray-200" />

              {drafts.map((draft, i) => {
                const hour = draft.scheduled_for
                  ? format(new Date(draft.scheduled_for), "HH:mm")
                  : "—"
                const variantLabel =
                  variantLabels[draft.variant - 1] ?? `V${draft.variant}`

                return (
                  <Section key={draft.id} className="mb-6">
                    <Text className="text-xs uppercase tracking-wider text-gray-500 m-0 mb-2 font-semibold">
                      {i + 1}. {hour} hs · {variantLabel}
                    </Text>

                    {draft.image_url ? (
                      <Img
                        src={draft.image_url}
                        alt="Imagen del post"
                        className="w-full rounded-md mb-3"
                      />
                    ) : null}

                    <Text className="text-sm text-gray-800 m-0 mb-3 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded border border-gray-100">
                      {draft.content.length > 400
                        ? `${draft.content.slice(0, 400)}...`
                        : draft.content}
                    </Text>

                    <Link
                      href={`${appUrl}/drafts?focus=${draft.id}`}
                      className="inline-block bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-semibold no-underline"
                    >
                      Postear ahora →
                    </Link>

                    {i < drafts.length - 1 ? (
                      <Hr className="my-6 border-gray-200" />
                    ) : null}
                  </Section>
                )
              })}

              <Hr className="my-6 border-gray-200" />

              <Text className="text-xs text-gray-500 m-0 leading-relaxed">
                Este email te llega porque tenés drafts agendados en{" "}
                <Link
                  href={`${appUrl}/calendar`}
                  className="text-gray-700 underline"
                >
                  tu calendario
                </Link>
                . Hemisferia Content OS.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
