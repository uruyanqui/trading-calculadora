"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Importamos ApexCharts solo en el lado del cliente
import dynamic from "next/dynamic"
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

// Tipos para los datos de velas
interface CandleData {
  datetime: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface CandlestickChartProps {
  ticker: string
  data: CandleData[]
  isMockData?: boolean
}

export function CandlestickChart({ ticker, data, isMockData = false }: CandlestickChartProps) {
  // Si no hay datos, mostrar un mensaje
  if (!data || data.length === 0) {
    return (
      <Card className="w-full bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Gráfico de {ticker}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>No hay datos disponibles para mostrar el gráfico.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Formatear los datos para ApexCharts
  const seriesData = data.map((item) => ({
    x: new Date(item.datetime),
    y: [item.open, item.high, item.low, item.close],
  }))

  // Obtener el rango de precios para configurar el eje Y
  const allPrices = data.flatMap((item) => [item.open, item.high, item.low, item.close])
  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)
  const priceRange = maxPrice - minPrice
  const yAxisMin = Math.max(0, minPrice - priceRange * 0.1)
  const yAxisMax = maxPrice + priceRange * 0.1

  // Configuración del gráfico
  const options = {
    chart: {
      type: "candlestick" as const,
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      background: "transparent",
      foreColor: "#94a3b8", // Color del texto para modo oscuro
    },
    title: {
      text: `${ticker} - Últimas 100 sesiones`,
      align: "left" as const,
      style: {
        color: "#e2e8f0", // Color del título para modo oscuro
      },
    },
    xaxis: {
      type: "datetime" as const,
      labels: {
        datetimeUTC: false,
        format: "dd MMM",
        style: {
          colors: "#94a3b8", // Color de las etiquetas para modo oscuro
        },
      },
      axisBorder: {
        color: "#334155", // Color del borde del eje para modo oscuro
      },
      axisTicks: {
        color: "#334155", // Color de las marcas del eje para modo oscuro
      },
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
      min: yAxisMin,
      max: yAxisMax,
      labels: {
        formatter: (val: number) => val.toFixed(2),
        style: {
          colors: "#94a3b8", // Color de las etiquetas para modo oscuro
        },
      },
    },
    tooltip: {
      x: {
        format: "dd MMM yyyy",
      },
      theme: "dark",
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#22c55e", // Verde para velas alcistas
          downward: "#ef4444", // Rojo para velas bajistas
        },
        wick: {
          useFillColor: true,
        },
      },
    },
    grid: {
      borderColor: "#334155", // Color de la cuadrícula para modo oscuro
      strokeDashArray: 2,
    },
    theme: {
      mode: "dark" as const,
    },
  }

  const series = [
    {
      name: "Precio",
      data: seriesData,
    },
  ]

  return (
    <Card className="w-full bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100">Gráfico de {ticker}</CardTitle>
      </CardHeader>
      <CardContent>
        {isMockData && (
          <Alert className="mb-4 border-amber-500 bg-amber-900/20 text-amber-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Datos simulados</AlertTitle>
            <AlertDescription>
              Este gráfico muestra datos simulados. Para ver datos reales, configura tu clave API de TwelveData.
            </AlertDescription>
          </Alert>
        )}
        <div className="h-[400px] w-full">
          <ReactApexChart options={options} series={series} type="candlestick" height={350} />
        </div>
      </CardContent>
    </Card>
  )
}
