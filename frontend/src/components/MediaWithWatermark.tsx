import React from 'react'
import ImageCanvas from './ImageCanvas'

interface Props {
  src: string
  alt?: string
  className?: string
  rounded?: boolean
  contain?: boolean
  mode?: 'visible' | 'subtle' | 'none'
}

function shouldUseImgOverlay(src: string) {
  // Preserve animation for GIF, WebP (may be animated), and APNG by rendering an <img> element
  try {
    const url = new URL(src, window.location.href)
    const pathname = url.pathname.toLowerCase()
    return /(\.gif|\.webp|\.apng)$/.test(pathname)
  } catch {
    return /(\.gif|\.webp|\.apng)(\?.*)?$/i.test(src)
  }
}

export default function MediaWithWatermark({ src, alt, className, rounded = false, contain = true, mode = 'visible' }: Props) {
  const watermark = import.meta.env.VITE_WATERMARK_TEXT || 'Meme Marketplace'

  const [useImg, setUseImg] = React.useState<boolean>(() => shouldUseImgOverlay(src))

  React.useEffect(() => {
    let aborted = false
    // If URL lacks a known animated extension, try to detect by Content-Type via a small ranged GET
    if (!shouldUseImgOverlay(src)) {
      const controller = new AbortController()
      fetch(src, { method: 'GET', headers: { Range: 'bytes=0-0' }, mode: 'cors', credentials: 'omit', signal: controller.signal })
        .then((res) => {
          const ct = (res.headers.get('Content-Type') || '').toLowerCase()
          if (!aborted && (ct.includes('image/gif') || ct.includes('image/webp') || ct.includes('image/apng'))) {
            setUseImg(true)
          }
        })
        .catch(() => { /* ignore network/CORS issues; fallback stays */ })
      return () => { aborted = true; controller.abort() }
    }
  }, [src])

  if (useImg) {
    // Use <img> to preserve animation; overlay a visible corner watermark.
    return (
      <div className={["relative", className || '', rounded ? 'overflow-hidden rounded' : ''].join(' ').trim()} onContextMenu={(e)=>e.preventDefault()}>
        <img
          src={src}
          alt={alt}
          decoding="async"
          className={[contain ? 'object-contain' : 'object-cover', 'absolute inset-0 w-full h-full'].join(' ')}
          draggable={false}
        />
        <div className="pointer-events-none select-none absolute bottom-2 right-2 text-[0.7rem] font-medium opacity-70 text-black bg-white/35 dark:text-white dark:bg-black/35 px-2 py-0.5 rounded">
          {watermark}
        </div>
      </div>
    )
  }

  // Static images: use Canvas with watermark
  return (
    <ImageCanvas src={src} alt={alt} className={className} rounded={rounded} contain={contain} mode={mode} />
  )
}
