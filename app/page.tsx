import { PositionSizingCalculator } from "@/components/position-sizing-calculator"
import { TwelveDataTest } from "@/components/twelve-data-test"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-100">Asesor Inteligente de Trading</h1>

        {/* Calculadora principal */}
        <PositionSizingCalculator />

        {/* Separador */}
        <div className="border-t border-slate-700 my-8"></div>

        {/* Componente de prueba de la API */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center text-slate-100">Prueba de API Twelve Data</h2>
          <TwelveDataTest />
        </div>
      </div>
    </main>
  )
}
