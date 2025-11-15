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

function isGif(src: string) {
  try {
    const url = new URL(src, window.location.href)
    const pathname = url.pathname.toLowerCase()
    return /\.gif$/.test(pathname)
  } catch {
    return /\.gif(\?.*)?$/i.test(src)
  }
}

export default function MediaWithWatermark({ src, alt, className, rounded = false, contain = true, mode = 'visible' }: Props) {
  const watermark = import.meta.env.VITE_WATERMARK_TEXT || 'Meme Marketplace'

  if (isGif(src)) {
    // Use <img> to preserve GIF animation; overlay a visible corner watermark.
    return (
      <div className={["relative", className || '', rounded ? 'overflow-hidden rounded' : ''].join(' ').trim()} onContextMenu={(e)=>e.preventDefault()}>
        <img src={src} alt={alt} className={[contain ? 'object-contain' : 'object-cover', 'w-full h-full'].join(' ')} draggable={false} />
        <div className="pointer-events-none select-none absolute bottom-2 right-2 text-[0.7rem] font-medium opacity-70 text-black bg-white/35 dark:text-white dark:bg-black/35 px-2 py-0.5 rounded">
          {watermark}
        </div>
      </div>
    )
  }

  // Non-GIF: use Canvas with watermark
  return (
    <ImageCanvas src={src} alt={alt} className={className} rounded={rounded} contain={contain} mode={mode} />
  )
}
