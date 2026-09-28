import { cn } from "@/lib/utils"

// Isotipo: un hemisferio (medio círculo lleno) sobre el horizonte.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("w-8 h-8", className)}
    >
      <rect width="32" height="32" rx="9" fill="currentColor" opacity="0.12" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 16a9 9 0 0 0 18 0Z" fill="currentColor" />
    </svg>
  )
}
