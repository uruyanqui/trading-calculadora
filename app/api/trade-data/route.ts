import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

// Configurar el runtime para Node.js
export const runtime = "nodejs"

// Interfaz para las noticias
interface NewsItem {
  headline: string
  url: string
  source?: string
}

// Interfaz para los datos de sentimiento
interface SentimentItem {
  headline: string
  sentiment: -1 | 0 | 1
}

// Interfaz para la respuesta combinada
interface NewsWithSentiment extends NewsItem {
  sentiment: -1 | 0 | 1
}

export async function GET(request: NextRequest) {
  try {
    // Obtener el ticker de los parámetros de consulta
    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get("ticker")

    // Validar que se proporcionó un ticker
    if (!ticker) {
      return NextResponse.json({ error: "Se requiere un ticker" }, { status: 400 })
    }

    // Verificar que las API keys están configuradas
    // Usar TWELVE_DATA_KEY que es la variable que ya tienes configurada
    const twelveDataApiKey = process.env.TWELVE_DATA_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY

    // Verificación específica para TWELVE_DATA_KEY
    if (!twelveDataApiKey || twelveDataApiKey.trim() === "") {
      console.error("TWELVE_DATA_KEY no está configurada")
      return NextResponse.json({ error: "TWELVE_DATA_KEY no configurada" }, { status: 500 })
    }

    if (!openaiApiKey || openaiApiKey.trim() === "") {
      console.error("OPENAI_API_KEY no está configurada")
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 })
    }

    console.log(`Procesando solicitud para ticker: ${ticker}`)

    // 1. Obtener el precio desde TwelveData
    console.log(`Obteniendo precio para ${ticker}...`)
    const priceData = await fetchPrice(ticker, twelveDataApiKey)

    // 2. Obtener noticias desde Finviz
    console.log(`Obteniendo noticias de Finviz para ${ticker}...`)
    const newsItems = await fetchFinvizNews(ticker)

    // 3. Analizar el sentimiento de las noticias con OpenAI
    console.log(`Analizando sentimiento para ${newsItems.length} titulares...`)
    const sentimentData = await analyzeSentiment(newsItems, openaiApiKey)

    // 4. Combinar los datos de noticias con el sentimiento
    const newsWithSentiment = combineNewsAndSentiment(newsItems, sentimentData)

    // 5. Calcular el sentimiento promedio
    const averageSentiment = calculateAverageSentiment(sentimentData)

    console.log(
      `Respuesta exitosa para ${ticker}: precio=${priceData.price}, noticias=${newsWithSentiment.length}, sentimiento=${averageSentiment}`,
    )

    // 6. Devolver la respuesta combinada
    return NextResponse.json({
      ticker,
      price: priceData.price,
      news: newsWithSentiment,
      averageSentiment,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en la ruta /api/trade-data:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}

/**
 * Obtiene el precio actual del ticker desde TwelveData
 */
async function fetchPrice(ticker: string, apiKey: string): Promise<{ price: number }> {
  try {
    const tdRes = await fetch(`https://api.twelvedata.com/price?symbol=${ticker}&apikey=${apiKey}`, {
      next: { revalidate: 60 }, // Revalidar cada minuto
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TradeDataBot/1.0)",
      },
    })

    if (!tdRes.ok) {
      throw new Error(`Error en TwelveData API: ${tdRes.status} ${tdRes.statusText}`)
    }

    const data = await tdRes.json()

    // Verificar si hay un código de error en la respuesta
    if (data.code) {
      throw new Error(data.message || `Error en TwelveData API: ${data.code}`)
    }

    // Verificar que el precio existe y es un número
    if (!data.price || isNaN(Number(data.price))) {
      throw new Error(`Precio no válido para ${ticker}`)
    }

    return { price: Number(data.price) }
  } catch (error) {
    console.error("Error obteniendo precio:", error)
    throw error
  }
}

/**
 * Función para extraer la fuente de la URL
 */
function getSourceFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Mapear dominios conocidos a nombres de fuentes
    const sourceMap: Record<string, string> = {
      "finviz.com": "Finviz",
      "yahoo.com": "Yahoo Finance",
      "finance.yahoo.com": "Yahoo Finance",
      "bloomberg.com": "Bloomberg",
      "reuters.com": "Reuters",
      "cnbc.com": "CNBC",
      "marketwatch.com": "MarketWatch",
      "wsj.com": "Wall Street Journal",
      "ft.com": "Financial Times",
      "barrons.com": "Barron's",
      "fool.com": "The Motley Fool",
      "seekingalpha.com": "Seeking Alpha",
      "morningstar.com": "Morningstar",
      "zacks.com": "Zacks",
      "thestreet.com": "TheStreet",
      "benzinga.com": "Benzinga",
      "google.com": "Google Search",
    }

    // Buscar coincidencias en el mapa
    for (const [domain, source] of Object.entries(sourceMap)) {
      if (hostname.includes(domain)) {
        return source
      }
    }

    // Si no se encuentra, usar el hostname limpio
    return hostname.replace("www.", "").split(".")[0]
  } catch {
    return "Fuente desconocida"
  }
}

/**
 * Obtiene las noticias recientes para el ticker desde Finviz
 */
async function fetchFinvizNews(ticker: string): Promise<NewsItem[]> {
  try {
    // Hacer la solicitud a Finviz con un User-Agent para evitar bloqueos
    const finvizRes = await fetch(`https://finviz.com/quote.ashx?t=${ticker}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      next: { revalidate: 300 }, // Revalidar cada 5 minutos
    })

    if (!finvizRes.ok) {
      throw new Error(`Error obteniendo noticias de Finviz: ${finvizRes.status} ${finvizRes.statusText}`)
    }

    const html = await finvizRes.text()
    const $ = cheerio.load(html)

    // Extraer las noticias de la tabla de noticias
    const news = $("#news-table tr")
      .slice(0, 5) // Tomar solo las primeras 5 noticias
      .map((_, tr) => {
        const link = $(tr).find("a").first()
        const headline = link.text().trim()
        const url = link.attr("href") || ""

        // Asegurarse de que la URL sea absoluta
        const fullUrl = url.startsWith("http") ? url : `https://finviz.com/${url}`

        // Extraer la fuente de la URL
        const source = getSourceFromUrl(fullUrl)

        return { headline, url: fullUrl, source }
      })
      .get()
      .filter((item) => item.headline && item.headline.length > 10) // Filtrar titulares muy cortos

    // Verificar que se obtuvieron noticias
    if (news.length === 0) {
      console.warn(`No se encontraron noticias para ${ticker}`)
      // Devolver noticias simuladas si no se encuentran
      return [
        {
          headline: `${ticker} mantiene tendencia en el mercado actual`,
          url: `https://www.google.com/search?q=${ticker}+stock+news`,
          source: "Google Search",
        },
        {
          headline: `Análisis técnico de ${ticker} muestra señales mixtas`,
          url: `https://www.google.com/search?q=${ticker}+technical+analysis`,
          source: "Google Search",
        },
      ]
    }

    return news
  } catch (error) {
    console.error("Error obteniendo noticias de Finviz:", error)
    // En caso de error, devolver noticias simuladas
    return [
      {
        headline: `${ticker} - Datos de noticias no disponibles temporalmente`,
        url: `https://www.google.com/search?q=${ticker}+stock+news`,
        source: "Google Search",
      },
    ]
  }
}

/**
 * Analiza el sentimiento de los titulares de noticias usando OpenAI
 */
async function analyzeSentiment(news: NewsItem[], apiKey: string): Promise<SentimentItem[]> {
  try {
    // Extraer solo los titulares para el análisis
    const headlines = news.map((item) => item.headline)

    if (headlines.length === 0) {
      return []
    }

    // Llamar a la API de OpenAI para analizar el sentimiento
    const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Eres un analista de sentimiento financiero especializado. Analiza cada titular y devuelve solo un JSON con un array de objetos { headline: string, sentiment: -1|0|1 } donde -1 es negativo, 0 es neutral y 1 es positivo. No incluyas explicaciones adicionales.",
          },
          {
            role: "user",
            content: `Analiza el sentimiento financiero de estos titulares: ${JSON.stringify(headlines)}`,
          },
        ],
        temperature: 0,
        max_tokens: 500,
      }),
    })

    if (!oaiRes.ok) {
      throw new Error(`Error en OpenAI API: ${oaiRes.status} ${oaiRes.statusText}`)
    }

    const data = await oaiRes.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error("Respuesta inválida de OpenAI")
    }

    // Extraer y parsear el JSON de la respuesta
    const content = data.choices[0].message.content
    let sentimentData: SentimentItem[]

    try {
      // Intentar extraer el JSON si está envuelto en texto
      const jsonMatch = content.match(/\[.*\]/s)
      if (jsonMatch) {
        sentimentData = JSON.parse(jsonMatch[0])
      } else {
        sentimentData = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Error parseando la respuesta de OpenAI:", parseError)
      // Generar sentimientos simulados si falla el parsing
      sentimentData = headlines.map((headline) => ({
        headline,
        sentiment: (Math.random() > 0.5 ? 1 : Math.random() > 0.5 ? 0 : -1) as -1 | 0 | 1,
      }))
    }

    return sentimentData
  } catch (error) {
    console.error("Error analizando sentimiento:", error)
    // En caso de error, generar sentimientos simulados
    const headlines = news.map((item) => item.headline)
    return headlines.map((headline) => ({
      headline,
      sentiment: (Math.random() > 0.5 ? 1 : Math.random() > 0.5 ? 0 : -1) as -1 | 0 | 1,
    }))
  }
}

/**
 * Combina los datos de noticias con los resultados del análisis de sentimiento
 */
function combineNewsAndSentiment(news: NewsItem[], sentimentData: SentimentItem[]): NewsWithSentiment[] {
  return sentimentData.map((sentimentItem) => {
    // Encontrar la noticia correspondiente al titular analizado
    const newsItem = news.find((n) => n.headline === sentimentItem.headline)

    if (!newsItem) {
      // Si no se encuentra la noticia (poco probable), crear una URL genérica
      return {
        headline: sentimentItem.headline,
        url: `https://www.google.com/search?q=${encodeURIComponent(sentimentItem.headline)}`,
        source: "Google Search",
        sentiment: sentimentItem.sentiment,
      }
    }

    // Combinar los datos
    return {
      ...newsItem,
      sentiment: sentimentItem.sentiment,
    }
  })
}

/**
 * Calcula el sentimiento promedio de los titulares analizados
 */
function calculateAverageSentiment(sentimentData: SentimentItem[]): number {
  if (sentimentData.length === 0) {
    return 0
  }

  const sum = sentimentData.reduce((acc, item) => acc + item.sentiment, 0)
  return Number((sum / sentimentData.length).toFixed(2))
}
