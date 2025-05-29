"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertCircle,
  Info,
  ExternalLink,
  CheckCircle,
  Bug,
  Building2,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TradeDataDisplay } from "@/components/trade-data-display"

// Tipos para el análisis de sentimiento
interface SentimentResult {
  headline: string
  sentiment: -1 | 0 | 1
  url: string
  source?: string
  matchedTerm?: string
}

interface TickerInfo {
  symbol: string
  name: string
  exchange: string
  type: string
  aliases: string[]
  isFallback?: boolean
}

interface SentimentResponse {
  results: SentimentResult[]
  averageSentiment: number
  isMockData?: boolean
  error?: string
  articlesFound?: number
  tickerInfo?: TickerInfo
  usedApi?: string
  debugInfo?: any
}

interface SentimentSummaryProps {
  ticker: string
}

export function SentimentSummary({ ticker }: SentimentSummaryProps) {
  const [sentimentData, setSentimentData] = useState<SentimentResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState<boolean>(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [showTradeData, setShowTradeData] = useState<boolean>(false)

  useEffect(() => {
    // Solo cargar datos si hay un ticker
    if (!ticker) return

    const fetchSentiment = async () => {
      setLoading(true)
      setError(null)

      try {
        // Construir URL de manera más robusta
        const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
        const url = `${baseUrl}/api/sentiment?ticker=${encodeURIComponent(ticker)}`

        console.log(`Fetching sentiment from: ${url}`)

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Error al obtener sentimiento: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setSentimentData(data)

        console.log(`Sentiment data received for ${ticker}:`, data.usedApi)
      } catch (err) {
        console.error("Error fetching sentiment:", err)
        setError(err instanceof Error ? err.message : "Error desconocido al obtener sentimiento")

        // Opcional: Mostrar datos mock en caso de error
        setSentimentData({
          results: [],
          averageSentiment: 0,
          isMockData: true,
          error: err instanceof Error ? err.message : "Error desconocido",
          tickerInfo: {
            symbol: ticker.toUpperCase(),
            name: `${ticker.toUpperCase()} Corporation`,
            exchange: "Unknown",
            type: "Common Stock",
            aliases: [ticker.toUpperCase()],
            isFallback: true,
          },
          usedApi: "Error fallback",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSentiment()
  }, [ticker])

  // Función para obtener información de depuración
  const fetchDebugInfo = async () => {
    try {
      const response = await fetch("/api/sentiment-debug")
      if (response.ok) {
        const data = await response.json()
        setDebugData(data)
        setShowDebug(true)
      }
    } catch (error) {
      console.error("Error fetching debug info:", error)
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
    if (!sentimentData) return null

    const { averageSentiment } = sentimentData

    if (averageSentiment > 0) {
      return <Badge className="bg-green-600 hover:bg-green-700">🟢 Sentimiento positivo</Badge>
    }

    if (averageSentiment < 0) {
      return <Badge className="bg-red-600 hover:bg-red-700">🔴 Sentimiento negativo</Badge>
    }

    return <Badge className="bg-amber-600 hover:bg-amber-700">🟠 Neutral</Badge>
  }

  // Función para verificar si es una fuente financiera confiable
  const isFinancialSource = (source: string) => {
    const financialSources = [
      "Bloomberg",
      "Reuters",
      "CNBC",
      "MarketWatch",
      "Yahoo Finance",
      "Wall Street Journal",
      "Financial Times",
      "Barron's",
      "The Motley Fool",
      "Seeking Alpha",
      "Morningstar",
      "Zacks",
      "TheStreet",
      "Benzinga",
    ]
    return financialSources.some((fs) => source.toLowerCase().includes(fs.toLowerCase()))
  }

  // Si no hay ticker, no mostrar nada
  if (!ticker) {
    return null
  }

  // Si se muestra la vista de TradeData, renderizar ese componente
  if (showTradeData) {
    return (
      <div className="space-y-4">
        <TradeDataDisplay ticker={ticker} />
        <div className="flex justify-center">
          <Button
            onClick={() => setShowTradeData(false)}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Volver al análisis de sentimiento
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="shadow-md bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <CardTitle className="text-slate-100">Sentimiento del mercado: {ticker}</CardTitle>
            {sentimentData?.tickerInfo && (
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <Building2 className="h-3 w-3" />
                <span>{sentimentData.tickerInfo.name}</span>
                {sentimentData.tickerInfo.isFallback && (
                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-400">
                    Info básica
                  </Badge>
                )}
              </div>
            )}
            {sentimentData && !sentimentData.isMockData && (
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {sentimentData.articlesFound || sentimentData.results.length} noticias verificadas
                </div>
                {sentimentData.usedApi && (
                  <div className="flex items-center gap-1">
                    <Info className="h-3 w-3 text-blue-500" />
                    Fuente: {sentimentData.usedApi}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sentimentData && getSentimentBadge()}
            <Button
              onClick={() => setShowTradeData(true)}
              variant="outline"
              size="sm"
              className="border-blue-500 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
            >
              Ver datos de trading
            </Button>
            {sentimentData?.isMockData && (
              <Button
                onClick={fetchDebugInfo}
                variant="outline"
                size="sm"
                className="border-amber-500 text-amber-400 hover:bg-amber-950"
              >
                <Bug className="h-3 w-3 mr-1" />
                Debug
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <Alert className="border-red-500 bg-red-900/20 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : sentimentData ? (
          <>
            {sentimentData.isMockData && (
              <Alert className="mb-4 border-amber-500 bg-amber-900/20 text-amber-300">
                <Info className="h-4 w-4" />
                <AlertTitle>Datos simulados</AlertTitle>
                <AlertDescription>
                  {sentimentData.error?.includes("rate") || sentimentData.error?.includes("Límite") ? (
                    <>
                      Se ha alcanzado el límite diario de la API de noticias (100 requests/día). Mostrando datos
                      simulados específicos para {sentimentData.tickerInfo?.name || ticker}.
                    </>
                  ) : (
                    <>
                      Mostrando datos de sentimiento simulados para {sentimentData.tickerInfo?.name || ticker}. Para
                      datos reales, asegúrate de configurar las claves de API necesarias.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!sentimentData.isMockData && (
              <Alert className="mb-4 border-green-500 bg-green-900/20 text-green-300">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Criterio de relevancia estricto</AlertTitle>
                <AlertDescription>
                  Solo se incluyen noticias que mencionan "{ticker}" o "{sentimentData.tickerInfo?.name}" directamente
                  en el título, de fuentes financieras verificadas.
                </AlertDescription>
              </Alert>
            )}

            {showDebug && debugData && (
              <Alert className="mb-4 border-blue-500 bg-blue-900/20 text-blue-300">
                <Bug className="h-4 w-4" />
                <AlertTitle>Información de depuración</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 text-xs space-y-1">
                    <div>
                      <strong>News API:</strong> {debugData.debugInfo?.newsApi?.isValid ? "✅ Válida" : "❌ Inválida"}
                    </div>
                    <div>
                      <strong>GNews API:</strong> {debugData.debugInfo?.gNewsApi?.isValid ? "✅ Válida" : "❌ Inválida"}
                    </div>
                    <div>
                      <strong>OpenAI API:</strong>{" "}
                      {debugData.debugInfo?.openaiApi?.isValid ? "✅ Válida" : "❌ Inválida"}
                    </div>
                    <div>
                      <strong>API Usada:</strong> {sentimentData.usedApi || "Desconocida"}
                    </div>
                    {debugData.newsApiTest && (
                      <div>
                        <strong>Test News API:</strong> {debugData.newsApiTest.ok ? "✅" : "❌"} (
                        {debugData.newsApiTest.status})
                      </div>
                    )}
                    {debugData.gNewsApiTest && (
                      <div>
                        <strong>Test GNews API:</strong> {debugData.gNewsApiTest.ok ? "✅" : "❌"} (
                        {debugData.gNewsApiTest.status})
                      </div>
                    )}
                    {debugData.openaiApiTest && (
                      <div>
                        <strong>Test OpenAI API:</strong> {debugData.openaiApiTest.ok ? "✅" : "❌"} (
                        {debugData.openaiApiTest.status})
                      </div>
                    )}
                  </div>
                  <Button onClick={() => setShowDebug(false)} variant="outline" size="sm" className="mt-2 text-xs">
                    Ocultar
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <ul className="space-y-3">
              {sentimentData.results.map((item, index) => (
                <li key={index} className="flex flex-col gap-2 p-3 rounded bg-slate-700 border-l-4 border-l-green-500">
                  <div className="flex items-start gap-2">
                    <div className="mt-1">{getSentimentIcon(item.sentiment)}</div>
                    <span className="text-slate-200 flex-1 leading-relaxed">{item.headline}</span>
                    {item.matchedTerm && (
                      <Badge className="text-xs bg-blue-600 text-blue-100">Menciona: {item.matchedTerm}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-400 border-t border-slate-600 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.source || "Fuente financiera"}</span>
                      {item.source && isFinancialSource(item.source) && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                          Fuente verificada
                        </Badge>
                      )}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Leer noticia
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>

            {sentimentData.results.length > 0 && (
              <div className="mt-4 p-3 bg-slate-700 rounded text-center">
                <div className="text-sm text-slate-300">
                  Sentimiento promedio:{" "}
                  <span className="font-bold text-slate-100">
                    {sentimentData.averageSentiment > 0 ? "+" : ""}
                    {sentimentData.averageSentiment.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Basado en {sentimentData.results.length} noticias que mencionan {ticker} en el título
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-slate-400 py-4">No hay datos de sentimiento disponibles</div>
        )}
      </CardContent>
    </Card>
  )
}
