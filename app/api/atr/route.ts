import { type NextRequest, NextResponse } from "next/server"

// Mock data for common tickers
const MOCK_PRICES: Record<string, number> = {
  SPY: 450.75,
  QQQ: 380.25,
  AAPL: 175.25,
  MSFT: 325.5,
  AMZN: 135.75,
  GOOGL: 140.25,
  TSLA: 250.3,
  META: 320.45,
  NVDA: 420.8,
  AMD: 145.6,
}

// Generate a realistic ATR value based on ticker and price
function generateMockATR(ticker: string): number {
  const upperTicker = ticker.toUpperCase()
  const price = MOCK_PRICES[upperTicker] || 100 + Math.random() * 50

  // ATR is typically 1-3% of price for most stocks
  let volatilityFactor = 0.01 + Math.random() * 0.02 // 1-3%

  // Adjust volatility for known volatile stocks
  if (upperTicker === "TSLA" || upperTicker === "NVDA" || upperTicker === "AMD") {
    volatilityFactor = 0.03 + Math.random() * 0.02 // 3-5%
  }

  return Number((price * volatilityFactor).toFixed(2))
}

export async function GET(request: NextRequest) {
  try {
    // Get the ticker from query parameters
    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get("ticker")
    const timePeriod = searchParams.get("period") || "20"

    // Validate ticker parameter
    if (!ticker) {
      return NextResponse.json({ error: "El parámetro ticker es requerido" }, { status: 400 })
    }

    // Get API key from environment variables
    const apiKey = process.env.TWELVE_DATA_KEY

    // Log para depuración (no incluye la clave completa)
    console.log(`TWELVE_DATA_KEY disponible: ${apiKey ? "Sí (longitud: " + apiKey.length + ")" : "No"}`)

    // If no API key is available, return mock data
    if (!apiKey || apiKey.trim() === "") {
      console.log("No API key found. Using mock ATR data for:", ticker)
      const mockATR = generateMockATR(ticker)

      return NextResponse.json({
        ticker,
        atr: mockATR,
        period: Number(timePeriod),
        timestamp: new Date().toISOString(),
        isMockData: true,
      })
    }

    // Only attempt API call if we have an API key
    console.log("Using API key to fetch real ATR data for:", ticker)

    try {
      // Fetch ATR data from TwelveData API - SIEMPRE usar HTTPS
      const apiUrl = `https://api.twelvedata.com/atr?symbol=${ticker}&interval=1day&time_period=${timePeriod}&apikey=${apiKey}`

      console.log("Fetching from TwelveData API URL:", apiUrl.replace(apiKey, "API_KEY_HIDDEN"))

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      })

      // Leer la respuesta como texto primero
      const responseText = await response.text()
      console.log("API Response Text (first 100 chars):", responseText.substring(0, 100) + "...")

      // Verificar si la respuesta parece ser un mensaje de error
      if (responseText.includes("Invalid") || responseText.includes("Error")) {
        console.error("TwelveData API returned error message:", responseText)
        const mockATR = generateMockATR(ticker)
        return NextResponse.json({
          ticker,
          atr: mockATR,
          period: Number(timePeriod),
          timestamp: new Date().toISOString(),
          isMockData: true,
          apiError: responseText,
        })
      }

      if (!response.ok) {
        console.error(`TwelveData API error (${response.status})`)
        const mockATR = generateMockATR(ticker)
        return NextResponse.json({
          ticker,
          atr: mockATR,
          period: Number(timePeriod),
          timestamp: new Date().toISOString(),
          isMockData: true,
          apiError: `Error ${response.status} from TwelveData API`,
        })
      }

      // Luego parsear como JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError)
        const mockATR = generateMockATR(ticker)
        return NextResponse.json({
          ticker,
          atr: mockATR,
          period: Number(timePeriod),
          timestamp: new Date().toISOString(),
          isMockData: true,
          apiError: "Invalid JSON response",
        })
      }

      // Check if we have valid ATR data
      if (data.values && Array.isArray(data.values) && data.values.length > 0) {
        return NextResponse.json({
          ticker,
          atr: Number.parseFloat(data.values[0].atr),
          period: Number(timePeriod),
          timestamp: new Date().toISOString(),
          isMockData: false,
        })
      }

      // Return mock data if API response is invalid
      const mockATR = generateMockATR(ticker)
      return NextResponse.json({
        ticker,
        atr: mockATR,
        period: Number(timePeriod),
        timestamp: new Date().toISOString(),
        isMockData: true,
        apiError: "Invalid API response",
      })
    } catch (fetchError) {
      console.error("Error fetching from TwelveData API:", fetchError)
      const mockATR = generateMockATR(ticker)
      return NextResponse.json({
        ticker,
        atr: mockATR,
        period: Number(timePeriod),
        timestamp: new Date().toISOString(),
        isMockData: true,
        apiError: fetchError instanceof Error ? fetchError.message : String(fetchError),
      })
    }
  } catch (error) {
    console.error("Error in ATR API route:", error)

    // Return mock data on any error
    const ticker = request.nextUrl.searchParams.get("ticker") || "UNKNOWN"
    const timePeriod = request.nextUrl.searchParams.get("period") || "20"
    const mockATR = generateMockATR(ticker)

    return NextResponse.json({
      ticker,
      atr: mockATR,
      period: Number(timePeriod),
      timestamp: new Date().toISOString(),
      isMockData: true,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
