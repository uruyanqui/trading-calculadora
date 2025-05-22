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

// Obtiene el precio actual desde nuestra ruta protegida
export async function getTickerPrice(ticker: string): Promise<{ price: number | null; isMockData: boolean }> {
  try {
    // Construir la URL completa para asegurarnos de que funcione en todos los entornos
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000"

    const apiUrl = `${baseUrl}/api/precio?ticker=${encodeURIComponent(ticker)}&_=${Date.now()}`
    console.log(`Fetching price from internal API: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error(`API error (${response.status}) fetching price for ${ticker}`)

      try {
        const errorText = await response.text()
        console.error("Error response:", errorText)
      } catch (e) {
        console.error("Could not read error response")
      }

      return {
        price: getFallbackPrice(ticker),
        isMockData: true,
      }
    }

    // Intentar leer la respuesta como texto primero para depuración
    const responseText = await response.text()

    // Verificar si la respuesta parece ser un mensaje de error
    if (responseText.includes("Invalid") || responseText.includes("Error")) {
      console.error("API returned error message:", responseText)
      return {
        price: getFallbackPrice(ticker),
        isMockData: true,
      }
    }

    // Luego parsear como JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError, "Response was:", responseText)
      return {
        price: getFallbackPrice(ticker),
        isMockData: true,
      }
    }

    return {
      price: data.price || getFallbackPrice(ticker),
      isMockData: data.isMockData === true,
    }
  } catch (error) {
    console.error("Error fetching ticker price:", error)
    return {
      price: getFallbackPrice(ticker),
      isMockData: true,
    }
  }
}

// Obtiene el ATR20 desde nuestra ruta protegida
export async function calculateATR20(ticker: string): Promise<{ atr: number | null; isMockData: boolean }> {
  try {
    // Construir la URL completa para asegurarnos de que funcione en todos los entornos
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000"

    const apiUrl = `${baseUrl}/api/atr?ticker=${encodeURIComponent(ticker)}&period=20&_=${Date.now()}`
    console.log(`Fetching ATR from internal API: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error(`API error (${response.status}) fetching ATR for ${ticker}`)

      try {
        const errorText = await response.text()
        console.error("Error response:", errorText)
      } catch (e) {
        console.error("Could not read error response")
      }

      return {
        atr: getFallbackATR(ticker),
        isMockData: true,
      }
    }

    // Intentar leer la respuesta como texto primero para depuración
    const responseText = await response.text()

    // Verificar si la respuesta parece ser un mensaje de error
    if (responseText.includes("Invalid") || responseText.includes("Error")) {
      console.error("API returned error message:", responseText)
      return {
        atr: getFallbackATR(ticker),
        isMockData: true,
      }
    }

    // Luego parsear como JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError, "Response was:", responseText)
      return {
        atr: getFallbackATR(ticker),
        isMockData: true,
      }
    }

    return {
      atr: data.atr || getFallbackATR(ticker),
      isMockData: data.isMockData === true,
    }
  } catch (error) {
    console.error("Error fetching ATR:", error)
    return {
      atr: getFallbackATR(ticker),
      isMockData: true,
    }
  }
}

// Obtiene datos históricos para el gráfico de velas
export async function getHistoricalData(ticker: string): Promise<{ data: CandleData[]; isMockData: boolean }> {
  try {
    // Construir la URL completa para asegurarnos de que funcione en todos los entornos
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000"

    const apiUrl = `${baseUrl}/api/historico?ticker=${encodeURIComponent(ticker)}&count=100&_=${Date.now()}`
    console.log(`Fetching historical data from internal API: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error(`API error (${response.status}) fetching historical data for ${ticker}`)
      return {
        data: [],
        isMockData: true,
      }
    }

    // Intentar leer la respuesta como texto primero para depuración
    const responseText = await response.text()

    // Verificar si la respuesta parece ser un mensaje de error
    if (responseText.includes("Invalid") || responseText.includes("Error")) {
      console.error("API returned error message:", responseText)
      return {
        data: [],
        isMockData: true,
      }
    }

    // Luego parsear como JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError, "Response was:", responseText)
      return {
        data: [],
        isMockData: true,
      }
    }

    return {
      data: data.data || [],
      isMockData: data.isMockData === true,
    }
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return {
      data: [],
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
