"use client"

import { useState } from "react"

// Interfaces para los datos de trading
export interface NewsWithSentiment {
  headline: string
  url: string
  sentiment: -1 | 0 | 1
}

export interface TradeData {
  ticker: string
  price: number
  news: NewsWithSentiment[]
  averageSentiment: number
  timestamp: string
}

interface UseTradeDataResult {
  data: TradeData | null
  loading: boolean
  error: string | null
  fetchData: (ticker: string) => Promise<void>
  clearData: () => void
}

/**
 * Hook personalizado para obtener y gestionar datos de trading completos
 * Incluye precio, noticias y análisis de sentimiento
 */
export function useTradeData(): UseTradeDataResult {
  const [data, setData] = useState<TradeData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener los datos completos de trading
  const fetchData = async (ticker: string) => {
    if (!ticker || ticker.trim() === "") {
      setError("Se requiere un ticker válido")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`Obteniendo datos de trading para: ${ticker}`)

      // Construir la URL con el ticker
      const url = `/api/trade-data?ticker=${encodeURIComponent(ticker.toUpperCase())}`

      // Realizar la petición al endpoint que incluye precio, noticias y sentimiento
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Siempre obtener datos frescos
      })

      // Verificar si la respuesta es correcta
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      // Parsear la respuesta
      const result = await response.json()

      // Validar que tenemos todos los datos necesarios
      if (!result.ticker || result.price === undefined || !result.news || result.averageSentiment === undefined) {
        throw new Error("Datos incompletos recibidos del servidor")
      }

      // Actualizar el estado con los datos obtenidos
      setData(result)

      console.log(`Datos obtenidos exitosamente para ${ticker}:`, {
        price: result.price,
        newsCount: result.news.length,
        sentiment: result.averageSentiment,
      })
    } catch (err) {
      console.error("Error obteniendo datos de trading:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar los datos
  const clearData = () => {
    setData(null)
    setError(null)
  }

  return {
    data,
    loading,
    error,
    fetchData,
    clearData,
  }
}
