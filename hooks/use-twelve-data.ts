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
  debug?: any
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

      // Obtener el texto de la respuesta para depuración
      const responseText = await response.text()

      // Intentar parsear como JSON
      let result: ApiResponse
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error parsing API response:", parseError)
        console.error("Response text:", responseText.substring(0, 200))
        throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok) {
        const errorMsg = result.message || result.error || `HTTP error! status: ${response.status}`
        console.error("API error:", errorMsg, result.debug || {})
        throw new Error(errorMsg)
      }

      if (!result.success) {
        const errorMsg = result.message || result.error || "Unknown error occurred"
        console.error("API error:", errorMsg, result.debug || {})
        throw new Error(errorMsg)
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
