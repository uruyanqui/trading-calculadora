"use client"

import { useState, useCallback } from "react"

interface TwelveDataPoint {
  datetime: string
  open: string
  high: string
  low: string
  close: string
  volume: string
}

interface TwelveDataMeta {
  symbol: string
  interval: string
  currency: string
  exchange_timezone: string
  exchange: string
  mic_code: string
  type: string
}

interface TwelveDataResponse {
  meta?: TwelveDataMeta
  values?: TwelveDataPoint[]
  status?: string
  message?: string
  code?: number
}

interface ApiResponse {
  success: boolean
  data?: TwelveDataResponse
  error?: string
  message?: string
}

interface UseTwelveDataReturn {
  data: TwelveDataResponse | null
  loading: boolean
  error: string | null
  fetchData: (symbol: string) => Promise<void>
  clearData: () => void
}

export function useTwelveData(): UseTwelveDataReturn {
  const [data, setData] = useState<TwelveDataResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (symbol: string) => {
    if (!symbol || typeof symbol !== "string") {
      setError("Invalid symbol provided")
      return
    }

    setLoading(true)
    setError(null)
    setData(null)

    try {
      console.log(`Fetching data for symbol: ${symbol}`)

      // Hacer la petición a nuestro endpoint seguro
      const response = await fetch(`/api/twelve?symbol=${encodeURIComponent(symbol)}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message || result.error || "Unknown error occurred")
      }

      if (!result.data) {
        throw new Error("No data received from API")
      }

      setData(result.data)
      console.log(`Successfully fetched data for ${symbol}:`, result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      console.error("Error fetching Twelve Data:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearData = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    fetchData,
    clearData,
  }
}
