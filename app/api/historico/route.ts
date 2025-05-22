import { type NextRequest, NextResponse } from "next/server"

// Tipos para los datos históricos
interface CandleData {
  datetime: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// Datos simulados para diferentes tickers
function generateMockHistoricalData(ticker: string, count = 100): CandleData[] {
  const upperTicker = ticker.toUpperCase()

  // Precio base para el ticker (similar a los precios simulados anteriores)
  const basePrice =
    {
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
    }[upperTicker] || 100 + Math.random() * 50

  // Volatilidad según el ticker
  let volatility = 0.01 // 1% por defecto

  if (upperTicker === "TSLA" || upperTicker === "NVDA" || upperTicker === "AMD") {
    volatility = 0.025 // 2.5% para acciones más volátiles
  }

  const data: CandleData[] = []
  let currentPrice = basePrice
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() - count) // Retroceder 100 días

  for (let i = 0; i < count; i++) {
    // Calcular fecha para este punto
    const pointDate = new Date(currentDate)
    pointDate.setDate(pointDate.getDate() + i)

    // Generar movimiento de precio aleatorio pero realista
    const changePercent = (Math.random() - 0.5) * volatility * 2
    currentPrice = currentPrice * (1 + changePercent)

    // Generar datos OHLC realistas
    const open = currentPrice
    const close = currentPrice * (1 + (Math.random() - 0.5) * volatility * 0.8)
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
    const volume = Math.floor(100000 + Math.random() * 900000)

    data.push({
      datetime: pointDate.toISOString(),
      open: Number.parseFloat(open.toFixed(2)),
      high: Number.parseFloat(high.toFixed(2)),
      low: Number.parseFloat(low.toFixed(2)),
      close: Number.parseFloat(close.toFixed(2)),
      volume,
    })

    // Actualizar el precio actual para el siguiente punto
    currentPrice = close
  }

  return data
}

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get("ticker")
    const count = Number.parseInt(searchParams.get("count") || "100", 10)

    // Validar parámetros
    if (!ticker) {
      return NextResponse.json({ error: "El parámetro ticker es requerido" }, { status: 400 })
    }

    // Obtener API key
    const apiKey = process.env.TWELVE_DATA_KEY

    // Log para depuración (no incluye la clave completa)
    console.log(`TWELVE_DATA_KEY disponible: ${apiKey ? "Sí (longitud: " + apiKey.length + ")" : "No"}`)

    // Verificar si la API key es válida
    const isValidApiKey = apiKey && apiKey.trim() !== "" && apiKey.length > 10

    // Si no hay API key válida, devolver datos simulados
    if (!isValidApiKey) {
      console.log("No API key found. Using mock historical data for:", ticker)
      const mockData = generateMockHistoricalData(ticker, count)

      return NextResponse.json({
        ticker,
        data: mockData,
        isMockData: true,
        timestamp: new Date().toISOString(),
      })
    }

    // Intentar obtener datos reales de TwelveData
    try {
      const apiUrl = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1day&outputsize=${count}&apikey=${apiKey}`

      console.log("Fetching historical data from TwelveData API URL:", apiUrl.replace(apiKey, "API_KEY_HIDDEN"))

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
        const mockData = generateMockHistoricalData(ticker, count)
        return NextResponse.json({
          ticker,
          data: mockData,
          isMockData: true,
          apiError: responseText,
          timestamp: new Date().toISOString(),
        })
      }

      // Parsear la respuesta como JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError)
        const mockData = generateMockHistoricalData(ticker, count)
        return NextResponse.json({
          ticker,
          data: mockData,
          isMockData: true,
          apiError: "Invalid JSON response",
          timestamp: new Date().toISOString(),
        })
      }

      // Verificar si tenemos datos válidos
      if (data.values && Array.isArray(data.values)) {
        // Transformar los datos al formato que necesitamos
        const formattedData = data.values.map((item: any) => ({
          datetime: item.datetime,
          open: Number.parseFloat(item.open),
          high: Number.parseFloat(item.high),
          low: Number.parseFloat(item.low),
          close: Number.parseFloat(item.close),
          volume: item.volume ? Number.parseInt(item.volume, 10) : undefined,
        }))

        return NextResponse.json({
          ticker,
          data: formattedData,
          isMockData: false,
          timestamp: new Date().toISOString(),
        })
      }

      // Si no hay datos válidos, devolver datos simulados
      const mockData = generateMockHistoricalData(ticker, count)
      return NextResponse.json({
        ticker,
        data: mockData,
        isMockData: true,
        apiError: "No valid data in response",
        timestamp: new Date().toISOString(),
      })
    } catch (fetchError) {
      console.error("Error fetching from TwelveData API:", fetchError)
      const mockData = generateMockHistoricalData(ticker, count)
      return NextResponse.json({
        ticker,
        data: mockData,
        isMockData: true,
        apiError: fetchError instanceof Error ? fetchError.message : String(fetchError),
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error in historico API route:", error)

    // Devolver datos simulados en caso de error
    const ticker = request.nextUrl.searchParams.get("ticker") || "UNKNOWN"
    const count = Number.parseInt(request.nextUrl.searchParams.get("count") || "100", 10)

    const mockData = generateMockHistoricalData(ticker, count)
    return NextResponse.json({
      ticker,
      data: mockData,
      isMockData: true,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })
  }
}
