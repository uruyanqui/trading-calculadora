import { PositionSizingCalculator } from "@/components/position-sizing-calculator"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-800 dark:text-slate-100">
          Calculadora de Tamaño de Posición
        </h1>
        <PositionSizingCalculator />
      </div>
    </main>
  )
}
