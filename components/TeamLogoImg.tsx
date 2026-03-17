'use client'

/**
 * Client component wrapper for ESPN team logos.
 * Needed because onError is an event handler and can't live in a Server Component.
 */
export function TeamLogoImg({
  espnId,
  name,
  size = 36,
  fallbackSeed,
}: {
  espnId: number
  name: string
  size?: number
  fallbackSeed?: number
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`}
      alt={`${name} logo`}
      width={size}
      height={size}
      className="object-contain"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement
        if (fallbackSeed !== undefined) {
          img.style.display = 'none'
          const parent = img.parentElement
          if (parent) {
            const span = document.createElement('span')
            span.className = 'text-sm font-bold text-gray-300'
            span.textContent = String(fallbackSeed)
            parent.appendChild(span)
          }
        } else {
          img.style.display = 'none'
        }
      }}
    />
  )
}
