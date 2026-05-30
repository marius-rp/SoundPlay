import React, { useState, useRef, useLayoutEffect } from "react"
import { createPortal } from "react-dom"

export type TooltipPosition = "top" | "bottom" | "left" | "right"

interface TooltipProps {
  children: React.ReactElement
  text: string
  position?: TooltipPosition
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  text,
  position = "top",
}) => {
  const [show, setShow] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [safeStyles, setSafeStyles] = useState<React.CSSProperties>({})

  useLayoutEffect(() => {
    if (!show || !triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const screenWidth = window.innerWidth
    const padding = 12

    let top = 0
    let left = 0

    if (position === "top") {
      top = triggerRect.top + window.scrollY - tooltipRect.height - 8
      left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2)
    } else if (position === "bottom") {
      top = triggerRect.bottom + window.scrollY + 8
      left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2)
    } else if (position === "left") {
      top = triggerRect.top + window.scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2)
      left = triggerRect.left + window.scrollX - tooltipRect.width - 8
    } else if (position === "right") {
      top = triggerRect.top + window.scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2)
      left = triggerRect.right + window.scrollX + 8
    }

    let currentStyle: React.CSSProperties = { whiteSpace: "max-content" }
    if (left + tooltipRect.width > screenWidth - padding) {
      const delta = (left + tooltipRect.width) - (screenWidth - padding)
      left = Math.max(padding, left - delta)
      
      if (tooltipRect.width > screenWidth - (padding * 2)) {
        currentStyle.whiteSpace = "normal"
        currentStyle.maxWidth = `${screenWidth - (padding * 2)}px`
      }
    }
    else if (left < padding) {
      left = padding
      if (tooltipRect.width > screenWidth - (padding * 2)) {
        currentStyle.whiteSpace = "normal"
        currentStyle.maxWidth = `${screenWidth - (padding * 2)}px`
      }
    }

    setCoords({ top, left })
    setSafeStyles(currentStyle)
  }, [show, position, text])

  return (
    <>
      <div
        className="inline-block"
        ref={triggerRef}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => {
          setShow(false)
          setSafeStyles({})
        }}
      >
        {children}
      </div>

      {show &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              ...safeStyles,
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="z-99999 px-2.5 py-1.5 bg-[#202020] border border-[#3e3e3e] text-white text-[10px] uppercase tracking-wider rounded shadow-xl pointer-events-none text-center wrap-break-word"
          >
            {text}
          </div>,
          document.body,
        )}
    </>
  )
}

export default Tooltip