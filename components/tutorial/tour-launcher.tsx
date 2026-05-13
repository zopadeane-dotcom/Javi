"use client"

import { useEffect, useState } from "react"
import { TutorialOverlay } from "./tutorial-overlay"

export function TourLauncher() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    function handler() { setActive(true) }
    window.addEventListener("workie:launch-tour", handler)
    return () => window.removeEventListener("workie:launch-tour", handler)
  }, [])

  if (!active) return null

  return <TutorialOverlay onFinish={() => setActive(false)} />
}
