"use server"

// Tipos para los datos históricos
interface CandleData {
  datetime: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// Obtiene el precio actual directamente desde la API de TwelveData
export async function getTickerPrice(ticker: string): Promise<{ price: number | null; isMockData: boolean }> {
  try {
    // Acceder directamente a la API key
    const apiKey = process.env.TWELVE_DATA_KEY

    // Verificar si la API key es válida
    const isValidApiKey = apiKey && apiKey.trim() !== "" && apiKey.length > 10

    if (!isValidApiKey) {
      console.log("API key is missing or invalid. Using mock price data for:", ticker)
      return {
        price: getFallbackPrice(ticker),
        isMockData: true,
      }
    }

    // Llamar directamente a la API de TwelveData
    const apiUrl = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`
    console.log(`Fetching price directly from TwelveData API for: ${ticker}`)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`TwelveData API error (${response.status}) fetching price for ${ticker}`)
      return {
        price: getFallbackPrice(ticker),
        isMockData: true,
      }
    }

    const data = await response.json()

    if (data.price) {
      return {
        price: Number.parseFloat(data.price),
        isMockData: false,
      }
    }

    // Si no hay datos válidos, devolver datos simulados
    return {
      price: getFallbackPrice(ticker),
      isMockData: true,
    }
  } catch (error) {
    console.error("Error fetching ticker price:", error)
    return {
      price: getFallbackPrice(ticker),
      isMockData: true,
    }
  }
}

// Obtiene el ATR20 directamente desde la API de TwelveData
export async function calculateATR20(ticker: string): Promise<{ atr: number | null; isMockData: boolean }> {
  try {
    // Acceder directamente a la API key
    const apiKey = process.env.TWELVE_DATA_KEY

    // Verificar si la API key es válida
    const isValidApiKey = apiKey && apiKey.trim() !== "" && apiKey.length > 10

    if (!isValidApiKey) {
      console.log("API key is missing or invalid. Using mock ATR data for:", ticker)
      return {
        atr: getFallbackATR(ticker),
        isMockData: true,
      }
    }

    // Llamar directamente a la API de TwelveData
    const apiUrl = `https://api.twelvedata.com/atr?symbol=${encodeURIComponent(ticker)}&interval=1day&time_period=20&apikey=${apiKey}`
    console.log(`Fetching ATR directly from TwelveData API for: ${ticker}`)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`TwelveData API error (${response.status}) fetching ATR for ${ticker}`)
      return {
        atr: getFallbackATR(ticker),
        isMockData: true,
      }
    }

    const data = await response.json()

    if (data.values && Array.isArray(data.values) && data.values.length > 0) {
      return {
        atr: Number.parseFloat(data.values[0].atr),
        isMockData: false,
      }
    }

    // Si no hay datos válidos, devolver datos simulados
    return {
      atr: getFallbackATR(ticker),
      isMockData: true,
    }
  } catch (error) {
    console.error("Error fetching ATR:", error)
    return {
      atr: getFallbackATR(ticker),
      isMockData: true,
    }
  }
}

// Obtiene datos históricos directamente desde la API de TwelveData
export async function getHistoricalData(ticker: string): Promise<{ data: CandleData[]; isMockData: boolean }> {
  try {
    // Acceder directamente a la API key
    const apiKey = process.env.TWELVE_DATA_KEY

    // Verificar si la API key es válida
    const isValidApiKey = apiKey && apiKey.trim() !== "" && apiKey.length > 10

    if (!isValidApiKey) {
      console.log("API key is missing or invalid. Using mock historical data for:", ticker)
      return {
        data: generateMockHistoricalData(ticker, 100),
        isMockData: true,
      }
    }

    // Llamar directamente a la API de TwelveData
    const apiUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(ticker)}&interval=1day&outputsize=100&apikey=${apiKey}`
    console.log(`Fetching historical data directly from TwelveData API for: ${ticker}`)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`TwelveData API error (${response.status}) fetching historical data for ${ticker}`)
      return {
        data: generateMockHistoricalData(ticker, 100),
        isMockData: true,
      }
    }

    const data = await response.json()

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

      return {
        data: formattedData,
        isMockData: false,
      }
    }

    // Si no hay datos válidos, devolver datos simulados
    return {
      data: generateMockHistoricalData(ticker, 100),
      isMockData: true,
    }
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return {
      data: generateMockHistoricalData(ticker, 100),
      isMockData: true,
    }
  }
}

// Fallback data for common tickers
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

// Get a fallback price for a ticker
function getFallbackPrice(ticker: string): number {
  const upperTicker = ticker.toUpperCase()
  return MOCK_PRICES[upperTicker] || 100 + Math.random() * 50
}

// Get a fallback ATR for a ticker
function getFallbackATR(ticker: string): number {
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
