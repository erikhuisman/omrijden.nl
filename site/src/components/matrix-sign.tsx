'use client';

import useImageData from "@/hooks/use-imagedata";
import { VmsImageData } from "@/types/display";
import { useCallback, useEffect, useRef } from 'react';

interface MaxtrixSignProps {
  image: VmsImageData
  borderWidth: number
  pixelGap: number
  pixelSize: number
}

export default function MaxtrixSign({ image, borderWidth, pixelGap, pixelSize }: MaxtrixSignProps) {
  const imageData = useImageData(`data:${image.mimeType};base64,${image.binary}`)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawPixels = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!imageData) return;
    const { data, width } = imageData;

    // pixels come in sets of 4
    for (let i = 0; i < data.length; i += 4) {
      const row = Math.floor(i / (width * 4));
      const col = (i / 4) % width;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
      ctx.strokeStyle = `rgba(${r},${g},${b},0.50)`
      ctx.lineWidth = pixelGap;

      ctx.beginPath();
      ctx.rect(
        borderWidth + (col * (pixelSize + pixelGap)),
        borderWidth + (row * (pixelSize + pixelGap)),
        pixelSize,
        pixelSize
      )
      ctx.fill()

      // give non black pixels an outline
      if (r + g + b !== 0) {
        ctx.stroke()
      };

    }

  }, [borderWidth, imageData, pixelGap, pixelSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return;
    const ctx = canvas.getContext('2d')
    if (!ctx) return;
    // draw the frame
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // draw the matrix background 
    ctx.fillStyle = '#222222'
    ctx.fillRect(borderWidth, borderWidth, ctx.canvas.width - borderWidth * 2, ctx.canvas.height - borderWidth * 2)

    drawPixels(ctx)
  }, [borderWidth, drawPixels, imageData])

  if (!imageData) return null;

  const width = (borderWidth * 2) + (imageData.width * (pixelSize + pixelGap));
  const height = (borderWidth * 2) + (imageData.height * (pixelSize + pixelGap));

  return <canvas width={`${width}px`} height={`${height}px`} ref={canvasRef} />
}

MaxtrixSign.defaultProps = {
  borderWidth: 10,
  pixelGap: 1,
  pixelSize: 2
}