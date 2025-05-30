"use client"

import { useState } from "react"
import { PositionSizingCalculator } from "@/components/position-sizing-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, ThumbsUp, ThumbsDown, Minus, ExternalLink, Brain } from "lucide-react"

// Interfaces para los datos de trading
interface NewsWithSentiment {
  headline: string
  url: string
  sentiment: -1 | 0 | 1
  source?: string
}

interface TradeData {
  ticker: string
  price: number
  news: NewsWithSentiment[]
  averageSentiment: number
  timestamp: string
}

export default function Home() {
  // Estados para el análisis de trading
  const [ticker, setTicker] = useState<string>("AAPL")
  const [tradeData, setTradeData] = useState<TradeData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener datos de trading completos
  const fetchTradeData = async () => {
    if (!ticker.trim()) {
      setError("Por favor ingresa un ticker válido")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`Obteniendo datos de trading para: ${ticker}`)

      // Llamar al endpoint de trade-data que incluye precio, noticias y sentimiento
      const response = await fetch(`/api/trade-data?ticker=${encodeURIComponent(ticker.toUpperCase())}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Verificar que tenemos los datos necesarios
      if (!data.price || !data.news || data.averageSentiment === undefined) {
        throw new Error("Datos incompletos recibidos del servidor")
      }

      setTradeData(data)
      console.log(`Datos obtenidos exitosamente para ${ticker}:`, {
        price: data.price,
        newsCount: data.news.length,
        sentiment: data.averageSentiment,
      })
    } catch (err) {
      console.error("Error obteniendo datos de trading:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener el icono según el sentimiento
  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0) return <ThumbsUp className="h-4 w-4 text-green-500" />
    if (sentiment < 0) return <ThumbsDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-amber-500" />
  }

  // Función para obtener el badge de sentimiento global
  const getSentimentBadge = () => {
    if (!tradeData) return null

    const { averageSentiment } = tradeData

    if (averageSentiment > 0) {
      return <Badge className="bg-green-600 hover:bg-green-700">🟢 Sentimiento positivo</Badge>
    }

    if (averageSentiment < 0) {
      return <Badge className="bg-red-600 hover:bg-red-700">🔴 Sentimiento negativo</Badge>
    }

    return <Badge className="bg-amber-600 hover:bg-amber-700">🟠 Neutral</Badge>
  }

  // Función para extraer la fuente de la URL
  const getSourceFromUrl = (url: string): string => {
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-100">Asesor Inteligente de Trading</h1>

        {/* Calculadora principal */}
        <PositionSizingCalculator />

        {/* Sección de análisis de sentimiento - movida al final */}
        <Card className="shadow-md bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Brain className="h-5 w-5" />
                  Análisis de Sentimiento
                </CardTitle>
                <p className="text-slate-300 text-sm mt-1">
                  Obtén precio actual, noticias financieras y análisis de sentimiento en una sola consulta
                </p>
              </div>
              {tradeData && getSentimentBadge()}
            </div>
          </CardHeader>
          <CardContent>
            {/* Input y botón para obtener datos */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <Label htmlFor="ticker-input" className="text-slate-200 text-sm mb-2 block">
                  Ticker del activo
                </Label>
                <Input
                  id="ticker-input"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Ej: AAPL, MSFT, TSLA"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                  onKeyPress={(e) => e.key === "Enter" && fetchTradeData()}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchTradeData}
                  disabled={loading || !ticker.trim()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    "Obtener sentimiento"
                  )}
                </Button>
              </div>
            </div>

            {/* Mostrar error si existe */}
            {error && (
              <Alert className="mb-6 border-red-500 bg-red-900/20 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  <p className="text-red-500">{error}</p>
                  {error.includes("TWELVE_DATA_KEY") && (
                    <p className="mt-2 text-sm">
                      Para usar esta funcionalidad, configura tu clave API de TwelveData en las variables de entorno:
                      <br />
                      <code className="bg-slate-800 px-2 py-1 rounded text-xs mt-1 block">
                        TWELVE_DATA_KEY=tu_clave_api_aqui
                      </code>
                    </p>
                  )}
                  {error.includes("OPENAI_API_KEY") && (
                    <p className="mt-2 text-sm">
                      Para usar esta funcionalidad, configura tu clave API de OpenAI en las variables de entorno:
                      <br />
                      <code className="bg-slate-800 px-2 py-1 rounded text-xs mt-1 block">
                        OPENAI_API_KEY=tu_clave_api_aqui
                      </code>
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Mostrar datos de trading si están disponibles */}
            {tradeData && (
              <div className="space-y-6">
                {/* Precio actual */}
                <div className="p-4 rounded-lg bg-slate-700 shadow-sm">
                  <div className="text-sm font-medium text-slate-400">Precio actual de {tradeData.ticker}</div>
                  <div className="text-3xl font-bold text-slate-100">${tradeData.price.toFixed(2)}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Actualizado: {new Date(tradeData.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Noticias con análisis de sentimiento */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                    Noticias recientes con análisis de sentimiento
                    {getSentimentBadge()}
                  </h3>

                  {tradeData.news.length > 0 ? (
                    <ul className="space-y-3">
                      {tradeData.news.map((item, index) => (
                        <li
                          key={index}
                          className="flex flex-col gap-2 p-4 rounded-lg bg-slate-700 border-l-4 border-l-blue-500 hover:bg-slate-600 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">{getSentimentIcon(item.sentiment)}</div>
                            <div className="flex-1">
                              <span className="text-slate-200 leading-relaxed block">{item.headline}</span>
                              <div className="text-xs text-slate-400 mt-1">
                                Fuente: {item.source || getSourceFromUrl(item.url)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-600">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm"
                            >
                              Leer noticia completa
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-slate-400 py-6 bg-slate-700 rounded-lg">
                      No hay noticias disponibles para {tradeData.ticker}
                    </div>
                  )}
                </div>

                {/* Resumen de sentimiento */}
                {tradeData.news.length > 0 && (
                  <div className="p-4 bg-slate-700 rounded-lg text-center">
                    <div className="text-sm text-slate-300">
                      Sentimiento promedio del mercado:{" "}
                      <span className="font-bold text-slate-100">
                        {tradeData.averageSentiment > 0 ? "+" : ""}
                        {tradeData.averageSentiment.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Basado en {tradeData.news.length} noticias recientes de {tradeData.ticker}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje inicial si no hay datos */}
            {!tradeData && !loading && !error && (
              <div className="text-center text-slate-400 py-8">
                <p>Ingresa un ticker y haz clic en "Obtener sentimiento" para ver el análisis completo</p>
                <p className="text-sm mt-2">Incluye precio actual, noticias financieras y análisis de sentimiento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
