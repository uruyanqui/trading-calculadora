'use client';

import { useState } from 'react';
import { PositionSizingCalculator } from '@/components/position-sizing-calculator';
import { TradeDataDisplay } from '@/components/trade-data-display';

export default function Home() {
  // --- Estado para manejar el ticker de sentimiento ---
  const [inputTicker, setInputTicker] = useState('');
  const [ticker, setTicker] = useState<string>('');

  const handleFetch = () => {
    const t = inputTicker.trim().toUpperCase();
    if (t) setTicker(t);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold text-center text-slate-100">
          Asesor Inteligente de Trading
        </h1>

        {/* 1. Calculadora principal */}
        <PositionSizingCalculator />

        {/* 2. Sección de Sentimiento de Mercado */}
        <section className="bg-slate-700 p-6 rounded-lg space-y-4">
          <h2 className="text-2xl font-semibold text-slate-100">
            Resumen Diario de Sentimiento
          </h2>

          {/* Input para ticker */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Ej: AAPL"
              value={inputTicker}
              onChange={(e) => setInputTicker(e.target.value)}
              className="flex-1 px-3 py-2 rounded border border-slate-500 bg-slate-800 text-slate-100"
            />
            <button
              onClick={handleFetch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Obtener Precio & Sentimiento
            </button>
          </div>

          {/* Componente que hace el fetch y muestra datos */}
          {ticker && (
            <TradeDataDisplay key={ticker} ticker={ticker} />
          )}
        </section>
      </div>
    </main>
  );
}
