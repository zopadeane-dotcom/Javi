"use client"

export function MonthPicker({ value }: { value: string }) {
  return (
    <input
      type="month"
      name="mes"
      defaultValue={value}
      className="border rounded-md px-3 py-1.5 text-sm"
      onChange={(e) => {
        const url = new URL(window.location.href)
        url.searchParams.set("mes", e.target.value)
        window.location.href = url.toString()
      }}
    />
  )
}
