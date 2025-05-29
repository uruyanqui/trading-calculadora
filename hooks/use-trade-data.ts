"use client"

import { useState, useEffect } from "react"

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
}

interface UseTradeDataResult {
  data: TradeData | null
  loading: boolean
  error: string | null
  fetchData: () => Promise<void>
}

/**
 * Hook personalizado para obtener y gestionar datos de trading
 */
export function useTradeData(ticker: string): UseTradeDataResult {
  const [data, setData] = useState<TradeData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener los datos
  const fetchData = async () => {
    if (!ticker) {
      setError("Se requiere un ticker")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Construir la URL con el ticker
      const url = `/api/trade-data?ticker=${encodeURIComponent(ticker)}`

      // Realizar la petición
      const response = await fetch(url)

      // Verificar si la respuesta es correcta
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      // Parsear la respuesta
      const result = await response.json()

      // Actualizar el estado con los datos obtenidos
      setData(result)
    } catch (err) {
      console.error("Error obteniendo datos de trading:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Efecto para cargar los datos automáticamente al montar el componente
  useEffect(() => {
    // No cargar automáticamente, solo cuando se llame a fetchData
    // Esto es para que el usuario pueda controlar cuándo se obtienen los datos
  }, [ticker])

  return { data, loading, error, fetchData }
}
