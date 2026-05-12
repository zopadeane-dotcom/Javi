"use client"

import { HelpCircle } from "lucide-react"

export function TutorialButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Ver tour guiado"
      className="fixed bottom-6 right-6 z-[150] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-110 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 active:scale-95"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  )
}
