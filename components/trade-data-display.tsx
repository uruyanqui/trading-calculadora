"use client"
import { useTradeData } from "@/hooks/use-trade-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, ThumbsUp, ThumbsDown, Minus, ExternalLink } from "lucide-react"

interface TradeDataDisplayProps {
  ticker: string
}

export function TradeDataDisplay({ ticker }: TradeDataDisplayProps) {
  // Usar el hook personalizado para obtener los datos
  const { data, loading, error, fetchData } = useTradeData(ticker)

  // Función para obtener el icono según el sentimiento
  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0) return <ThumbsUp className="h-4 w-4 text-green-500" />
    if (sentiment < 0) return <ThumbsDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-amber-500" />
  }

  // Función para obtener el badge de sentimiento global
  const getSentimentBadge = () => {
    if (!data) return null

    const { averageSentiment } = data

    if (averageSentiment > 0) {
      return <Badge className="bg-green-600 hover:bg-green-700">🟢 Sentimiento positivo</Badge>
    }

    if (averageSentiment < 0) {
      return <Badge className="bg-red-600 hover:bg-red-700">🔴 Sentimiento negativo</Badge>
    }

    return <Badge className="bg-amber-600 hover:bg-amber-700">🟠 Neutral</Badge>
  }

  return (
    <Card className="shadow-md bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-slate-100">Datos de Trading: {ticker}</CardTitle>
          <div className="flex items-center gap-2">
            {data && getSentimentBadge()}
            <Button
              onClick={fetchData}
              disabled={loading}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Obtener Datos"
              )}
            </Button>
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
        ) : data ? (
          <div className="space-y-4">
            {/* Mostrar el precio */}
            <div className="p-4 rounded-lg bg-slate-700 shadow-sm">
              <div className="text-sm font-medium text-slate-400">Precio actual</div>
              <div className="text-2xl font-bold text-slate-100">${data.price.toFixed(2)}</div>
            </div>

            {/* Mostrar las noticias con sentimiento */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-slate-200">Noticias recientes</h3>

              {data.news.length > 0 ? (
                <ul className="space-y-3">
                  {data.news.map((item, index) => (
                    <li
                      key={index}
                      className="flex flex-col gap-2 p-3 rounded bg-slate-700 border-l-4 border-l-green-500"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-1">{getSentimentIcon(item.sentiment)}</div>
                        <span className="text-slate-200 flex-1 leading-relaxed">{item.headline}</span>
                      </div>
                      <div className="flex items-center justify-end mt-1 text-xs text-slate-400 border-t border-slate-600 pt-2">
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
              ) : (
                <div className="text-center text-slate-400 py-4">No hay noticias disponibles</div>
              )}
            </div>

            {/* Mostrar el sentimiento promedio */}
            {data.news.length > 0 && (
              <div className="mt-4 p-3 bg-slate-700 rounded text-center">
                <div className="text-sm text-slate-300">
                  Sentimiento promedio:{" "}
                  <span className="font-bold text-slate-100">
                    {data.averageSentiment > 0 ? "+" : ""}
                    {data.averageSentiment.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Basado en {data.news.length} noticias recientes de {ticker}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-8">
            <p>Haz clic en "Obtener Datos" para ver información de trading para {ticker}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
