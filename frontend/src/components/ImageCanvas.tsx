import React, { useEffect, useRef, useState } from 'react'

export type WatermarkMode = 'visible' | 'subtle' | 'none'

interface Props {
  src: string
  alt?: string
  className?: string
  watermarkText?: string
  mode?: WatermarkMode
  rounded?: boolean
  contain?: boolean // object-fit: contain vs cover
}

export default function ImageCanvas({ src, alt, className, watermarkText, mode = 'visible', rounded = false, contain = true }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.referrerPolicy = 'no-referrer'
    img.src = src
    img.onload = () => {
      if (cancelled) return
      setLoaded(true)
      draw(img)
    }
    img.onerror = () => { setLoaded(true) }

    const ro = new ResizeObserver(() => { if (img.complete) draw(img) })
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => { cancelled = true; ro.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, mode, watermarkText, contain])

  function draw(img: HTMLImageElement) {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    const width = Math.max(1, Math.floor(wrap.clientWidth))
    const height = Math.max(1, Math.floor(wrap.clientHeight))
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    // Object-fit
    let scale: number
    if (contain) {
      scale = Math.min(width / img.naturalWidth, height / img.naturalHeight)
    } else {
      scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
    }
    const drawW = img.naturalWidth * scale
    const drawH = img.naturalHeight * scale
    const dx = (width - drawW) / 2
    const dy = (height - drawH) / 2
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, dx, dy, drawW, drawH)

    if (mode !== 'none') paintWatermark(ctx, width, height, watermarkText || defaultWatermark(), mode)
  }

  function defaultWatermark() { return import.meta.env.VITE_WATERMARK_TEXT || 'Meme Marketplace' }

  return (
    <div ref={wrapRef} className={[className || '', rounded ? 'overflow-hidden rounded' : ''].join(' ').trim()} onContextMenu={(e)=>e.preventDefault()}>
      <canvas ref={canvasRef} aria-label={alt} role="img" />
      {!loaded && (<div className="w-full h-full flex items-center justify-center text-sm text-slate-400">Loading…</div>)}
    </div>
  )
}

function paintWatermark(ctx: CanvasRenderingContext2D, width: number, height: number, text: string, mode: WatermarkMode) {
  const padding = Math.floor(Math.min(width, height) * 0.04)
  const baseSize = Math.floor(Math.min(width, height) * 0.06)

  if (mode === 'visible') {
    ctx.save()
    ctx.globalAlpha = 0.16
    ctx.translate(width / 2, height / 2)
    ctx.rotate((-20 * Math.PI) / 180)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#000'
    ctx.font = `${Math.max(14, baseSize)}px sans-serif`
    const step = Math.max(160, baseSize * 4)
    for (let y = -height; y <= height; y += step) {
      for (let x = -width; x <= width; x += step) {
        ctx.fillText(text, x, y)
      }
    }
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#000'
    ctx.font = `${Math.max(14, Math.floor(baseSize * 0.65))}px sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(text, width - padding, height - padding)
    ctx.restore()
  } else if (mode === 'subtle') {
    ctx.save()
    ctx.globalAlpha = 0.25
    ctx.fillStyle = '#000'
    ctx.font = `${Math.max(12, Math.floor(baseSize * 0.5))}px sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(text, width - padding, height - padding)
    ctx.restore()
  }
}
