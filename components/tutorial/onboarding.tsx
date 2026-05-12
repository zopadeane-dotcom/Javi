"use client"

import { useEffect, useState } from "react"
import { WelcomeScreen } from "./welcome-screen"
import { TutorialOverlay } from "./tutorial-overlay"
import { TutorialButton } from "./tutorial-button"

const STORAGE_KEY = "workie_onboarded"

type Phase = "idle" | "welcome" | "tour" | "done"

export function Onboarding({ userName }: { userName: string }) {
  const [phase, setPhase] = useState<Phase>("idle")

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      // Primera vez — mostrar bienvenida
      const t = setTimeout(() => setPhase("welcome"), 600)
      return () => clearTimeout(t)
    } else {
      setPhase("done")
    }
  }, [])

  function startTour() {
    setPhase("tour")
  }

  function skipAll() {
    localStorage.setItem(STORAGE_KEY, "true")
    setPhase("done")
  }

  function finishTour() {
    localStorage.setItem(STORAGE_KEY, "true")
    setPhase("done")
  }

  function relaunchTour() {
    setPhase("tour")
  }

  if (phase === "idle") return null

  return (
    <>
      {phase === "welcome" && (
        <WelcomeScreen
          userName={userName}
          onStartTour={startTour}
          onSkip={skipAll}
        />
      )}
      {phase === "tour" && (
        <TutorialOverlay onFinish={finishTour} />
      )}
      {phase === "done" && (
        <TutorialButton onClick={relaunchTour} />
      )}
    </>
  )
}
