"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, Minus, ExternalLink } from "lucide-react"

// Interfaces para los datos de trading
export interface NewsWithSentiment {
  headline: string
  url: string
  sentiment: -1 | 0 | 1
}

export interface TradeData {
  ticker: string
  price: number
  news: NewsWithSentiment[]
  averageSentiment: number
  timestamp?: string
}

interface TradeDataDisplayProps {
  data: TradeData
}

export function TradeDataDisplay({ data }: TradeDataDisplayProps) {
  // Función para obtener el icono según el sentimiento
  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0) return <ThumbsUp className="h-4 w-4 text-green-500" />
    if (sentiment < 0) return <ThumbsDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-amber-500" />
  }

  // Función para obtener el badge de sentimiento global
  const getSentimentBadge = () => {
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
          <CardTitle className="text-slate-100">Datos de Trading: {data.ticker}</CardTitle>
          {getSentimentBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Mostrar el precio */}
          <div className="p-4 rounded-lg bg-slate-700 shadow-sm">
            <div className="text-sm font-medium text-slate-400">Precio actual</div>
            <div className="text-2xl font-bold text-slate-100">${data.price.toFixed(2)}</div>
            {data.timestamp && (
              <div className="text-xs text-slate-400 mt-1">
                Actualizado: {new Date(data.timestamp).toLocaleString()}
              </div>
            )}
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
                Basado en {data.news.length} noticias recientes de {data.ticker}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
