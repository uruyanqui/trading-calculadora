import { type NextRequest, NextResponse } from "next/server"

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
  debug?: any // Solo para desarrollo
}

export async function GET(request: NextRequest) {
  try {
    // Obtener el símbolo de los parámetros de consulta
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get("symbol")

    // Validar que el símbolo esté presente
    if (!symbol || typeof symbol !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid symbol parameter",
          message: "Please provide a valid symbol parameter",
        },
        { status: 400 },
      )
    }

    // Acceder directamente a la variable de entorno
    const apiKey = process.env.TWELVE_DATA_KEY

    // Información de depuración (solo en desarrollo)
    const debugInfo = {
      envVarExists: !!apiKey,
      envVarLength: apiKey ? apiKey.length : 0,
      nodeEnv: process.env.NODE_ENV,
    }

    // Verificar que la clave API esté disponible
    if (!apiKey) {
      console.error("TWELVE_DATA_KEY not found in environment variables")
      return NextResponse.json(
        {
          success: false,
          error: "API key not configured",
          message: "Server configuration error: API key not available",
          debug: process.env.NODE_ENV === "development" ? debugInfo : undefined,
        },
        { status: 500 },
      )
    }

    // Validar que la clave API tenga un formato válido
    if (typeof apiKey !== "string" || apiKey.trim().length < 10) {
      console.error("Invalid TWELVE_DATA_KEY format")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key format",
          message: "Server configuration error: Invalid API key",
          debug: process.env.NODE_ENV === "development" ? debugInfo : undefined,
        },
        { status: 500 },
      )
    }

    // Construir la URL de la API de Twelve Data
    const apiUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=30&apikey=${apiKey}`

    console.log(`Fetching data for symbol: ${symbol}`)

    // Hacer la petición a la API de Twelve Data
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // No usar caché para obtener datos frescos
      cache: "no-store",
    })

    // Verificar si la respuesta HTTP es exitosa
    if (!response.ok) {
      console.error(`Twelve Data API HTTP error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        {
          success: false,
          error: "External API error",
          message: `Twelve Data API returned ${response.status}: ${response.statusText}`,
        },
        { status: response.status },
      )
    }

    // Leer la respuesta como texto primero para depuración
    const responseText = await response.text()

    // Verificar si la respuesta contiene errores conocidos
    if (responseText.includes("Invalid API key") || responseText.includes("Unauthorized")) {
      console.error("Twelve Data API: Invalid API key")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key",
          message: "The provided API key is invalid or unauthorized",
          debug: process.env.NODE_ENV === "development" ? { responseText: responseText.substring(0, 200) } : undefined,
        },
        { status: 401 },
      )
    }

    if (responseText.includes("Symbol not found") || responseText.includes("Invalid symbol")) {
      return NextResponse.json(
        {
          success: false,
          error: "Symbol not found",
          message: `Symbol "${symbol}" not found or invalid`,
        },
        { status: 404 },
      )
    }

    // Intentar parsear la respuesta como JSON
    let data: TwelveDataResponse
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error parsing Twelve Data response:", parseError)
      console.error("Response text:", responseText.substring(0, 200))
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response format",
          message: "Unable to parse response from Twelve Data API",
          debug: process.env.NODE_ENV === "development" ? { responseText: responseText.substring(0, 200) } : undefined,
        },
        { status: 502 },
      )
    }

    // Verificar si la respuesta contiene un error de la API
    if (data.status === "error" || data.code) {
      console.error("Twelve Data API error:", data.message || "Unknown error")
      return NextResponse.json(
        {
          success: false,
          error: "API error",
          message: data.message || "Unknown error from Twelve Data API",
        },
        { status: 400 },
      )
    }

    // Verificar si tenemos datos válidos
    if (!data.values || !Array.isArray(data.values) || data.values.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No data available",
          message: `No time series data available for symbol "${symbol}"`,
        },
        { status: 404 },
      )
    }

    console.log(`Successfully fetched ${data.values.length} data points for ${symbol}`)

    // Devolver la respuesta exitosa con los datos completos
    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error("Unexpected error in /api/twelve:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
