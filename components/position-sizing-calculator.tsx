"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Loader2, Info, Target, Brain } from "lucide-react"
import { getTickerPrice, calculateATR20, getHistoricalData } from "@/app/actions/stock-data"
import { CandlestickChart } from "@/components/candlestick-chart"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Tipos para los datos de velas
interface CandleData {
  datetime: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface CalculationHistory {
  id: string
  date: Date
  ticker: string
  capital: number
  shares: number
  risk: number
  price: number
  atr: number
  objective?: string
}

// Objetivos de trading disponibles
const TRADING_OBJECTIVES = [
  { value: "preservation", label: "Preservación del Capital" },
  { value: "income", label: "Generación de Ingresos" },
  { value: "growth", label: "Crecimiento del Capital" },
  { value: "hedging", label: "Cobertura contra Riesgos" },
  { value: "speculation", label: "Especulación" },
]

export function PositionSizingCalculator() {
  // Form state
  const [capital, setCapital] = useState<number>(10000)
  const [ticker, setTicker] = useState<string>("AAPL")
  const [price, setPrice] = useState<number>(0)
  const [atr20, setAtr20] = useState<number>(0)
  const [atrMultiplier, setAtrMultiplier] = useState<number>(1)
  const [riskPercentage, setRiskPercentage] = useState<number>(1.5)
  const [objective, setObjective] = useState<string>("preservation")

  // Results state
  const [riskAmount, setRiskAmount] = useState<number>(0)
  const [stopLossDistance, setStopLossDistance] = useState<number>(0)
  const [shares, setShares] = useState<number>(0)
  const [usedMargin, setUsedMargin] = useState<number>(0)
  const [availableMargin, setAvailableMargin] = useState<number>(0)
  const [isCalculated, setIsCalculated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [history, setHistory] = useState<CalculationHistory[]>([])
  const [usingMockData, setUsingMockData] = useState<boolean>(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [showChart, setShowChart] = useState<boolean>(false)
  const [chartIsMockData, setChartIsMockData] = useState<boolean>(false)

  // Fetch price and ATR function
  const fetchPriceAndATR = async () => {
    if (!ticker) {
      setError("Por favor ingresa un ticker válido")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Paso 1: Obtener el precio
      console.log(`Fetching price for ticker: ${ticker}`)
      const priceResult = await getTickerPrice(ticker)

      if (priceResult.price === null) {
        setError(`No se pudo obtener el precio para ${ticker}. Verifica que el ticker sea válido.`)
        setIsLoading(false)
        return
      }

      setPrice(priceResult.price)
      let isMockData = priceResult.isMockData

      // Paso 2: Obtener el ATR
      console.log(`Fetching ATR for ticker: ${ticker}`)
      const atrResult = await calculateATR20(ticker)

      if (atrResult.atr === null) {
        setError(`No se pudo calcular el ATR para ${ticker}. Verifica que el ticker sea válido.`)
        setIsLoading(false)
        return
      }

      setAtr20(atrResult.atr)
      isMockData = isMockData || atrResult.isMockData

      // Paso 3: Obtener datos históricos para el gráfico
      console.log(`Fetching historical data for ticker: ${ticker}`)
      const historicalResult = await getHistoricalData(ticker)
      setChartData(historicalResult.data)
      setChartIsMockData(historicalResult.isMockData)
      setShowChart(true)

      // Actualizar estado de datos simulados
      setUsingMockData(isMockData)
      if (isMockData) {
        console.log("Using mock data for:", ticker)
        setWarning(
          "Usando datos simulados. Para datos en tiempo real, configura una clave API de TwelveData en el archivo .env.local",
        )
      } else {
        console.log("Using real data for:", ticker)
        setWarning(null)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Error al obtener datos. Usando datos simulados.")

      // Establecer datos simulados para que la aplicación siga funcionando
      setPrice(getFallbackPrice(ticker))
      setAtr20(getFallbackATR(ticker))
      setUsingMockData(true)
      setShowChart(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate shares and margin
  const calculateShares = () => {
    if (!capital || !price || !atr20 || !atrMultiplier || !riskPercentage) {
      setError("Por favor completa todos los campos")
      return
    }

    const calculatedRiskAmount = capital * (riskPercentage / 100)
    const calculatedStopLossDistance = atr20 * atrMultiplier
    const calculatedShares = Math.floor(calculatedRiskAmount / calculatedStopLossDistance)

    // Calculate margin information
    const calculatedUsedMargin = calculatedShares * price
    const calculatedAvailableMargin = capital - calculatedUsedMargin

    setRiskAmount(calculatedRiskAmount)
    setStopLossDistance(calculatedStopLossDistance)
    setShares(calculatedShares)
    setUsedMargin(calculatedUsedMargin)
    setAvailableMargin(calculatedAvailableMargin)
    setIsCalculated(true)
    setError(null)

    // Reset AI analysis when recalculating
    setAiAnalysis(null)

    // Add to history
    const newHistoryItem: CalculationHistory = {
      id: Date.now().toString(),
      date: new Date(),
      ticker,
      capital,
      shares: calculatedShares,
      risk: riskPercentage,
      price,
      atr: atr20,
      objective: TRADING_OBJECTIVES.find((obj) => obj.value === objective)?.label || objective,
    }

    setHistory((prev) => [newHistoryItem, ...prev].slice(0, 10)) // Keep only the last 10 entries
  }

  // Get objective label from value
  const getObjectiveLabel = (value: string): string => {
    return TRADING_OBJECTIVES.find((obj) => obj.value === value)?.label || value
  }

  // Fetch AI analysis
  const fetchAiAnalysis = async () => {
    if (!isCalculated) {
      setError("Por favor calcula el tamaño de posición primero")
      return
    }

    setIsLoadingAnalysis(true)
    setError(null)

    try {
      // Obtener el objetivo actual
      const currentObjectiveLabel = getObjectiveLabel(objective)

      // Usar window.location para obtener la URL base
      const baseUrl = window.location.origin
      const apiUrl = `${baseUrl}/api/analisis-ia`

      console.log(`Fetching AI analysis from: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker,
          price,
          capital,
          riskPercentage,
          atr20,
          atrMultiplier,
          objective,
          objectiveLabel: currentObjectiveLabel,
          shares,
          usedMargin,
          availableMargin,
        }),
      })

      if (!response.ok) {
        console.error(`API error (${response.status}) fetching AI analysis`)
        throw new Error(`Error ${response.status} from AI analysis API`)
      }

      const data = await response.json()

      if (data.error) {
        console.warn("API returned error but with fallback analysis:", data.error)
      }

      // Usar el análisis incluso si hay un error, ya que siempre proporcionamos un fallback
      setAiAnalysis(data.analysis || "No se pudo generar un análisis en este momento.")
    } catch (error) {
      console.error("Error fetching AI analysis:", error)

      // Proporcionar un análisis simulado en caso de error
      let fallbackAnalysis = ""

      switch (objective) {
        case "preservation":
          fallbackAnalysis =
            "Considera reducir el tamaño de posición para minimizar el riesgo. La preservación de capital debe ser tu prioridad."
          break
        case "income":
          fallbackAnalysis =
            "El nivel de riesgo es apropiado para generación de ingresos. Evalúa vender calls cubiertos."
          break
        case "growth":
          fallbackAnalysis =
            "Buen balance entre riesgo y potencial de crecimiento. Mantén stops en niveles técnicos clave."
          break
        case "hedging":
          fallbackAnalysis =
            "Esta posición ofrece buena cobertura. Considera correlaciones con el resto de tu portafolio."
          break
        case "speculation":
          fallbackAnalysis =
            "La volatilidad actual justifica tu nivel de riesgo especulativo. Mantén disciplina en tus salidas."
          break
        default:
          fallbackAnalysis = "Mantén un tamaño de posición adecuado a tu perfil de riesgo y objetivo de trading."
      }

      setAiAnalysis(fallbackAnalysis)
      setError("Error al conectar con el servicio de IA. Mostrando recomendación predeterminada.")
    } finally {
      setIsLoadingAnalysis(false)
    }
  }

  // Función para obtener un precio simulado
  function getFallbackPrice(ticker: string): number {
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
    const upperTicker = ticker.toUpperCase()
    return MOCK_PRICES[upperTicker] || 100 + Math.random() * 50
  }

  // Función para obtener un ATR simulado
  function getFallbackATR(ticker: string): number {
    const upperTicker = ticker.toUpperCase()
    const price = getFallbackPrice(upperTicker)

    // ATR is typically 1-3% of price for most stocks
    let volatilityFactor = 0.01 + Math.random() * 0.02 // 1-3%

    // Adjust volatility for known volatile stocks
    if (upperTicker === "TSLA" || upperTicker === "NVDA" || upperTicker === "AMD") {
      volatilityFactor = 0.03 + Math.random() * 0.02 // 3-5%
    }

    return Number((price * volatilityFactor).toFixed(2))
  }

  // Modificar la estructura del grid para dar más espacio a los componentes
  return (
    <div className="grid gap-6">
      {/* Objetivo de Trading */}
      <Card className="shadow-md bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Target className="h-5 w-5" />
            Objetivo de Trading
          </CardTitle>
          <CardDescription className="text-slate-300">
            Selecciona tu objetivo principal para esta operación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Selecciona un objetivo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectGroup>
                    <SelectLabel className="text-slate-300">Objetivos</SelectLabel>
                    {TRADING_OBJECTIVES.map((obj) => (
                      <SelectItem
                        key={obj.value}
                        value={obj.value}
                        className="text-slate-100 focus:bg-slate-700 focus:text-slate-100"
                      >
                        {obj.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parámetros de Operación y Gráfico */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Parámetros de Operación */}
        <Card className="shadow-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Parámetros de Operación</CardTitle>
            <CardDescription className="text-slate-300">
              Ingresa los detalles de tu operación para calcular el tamaño óptimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capital" className="text-slate-200">
                  Capital disponible ($)
                </Label>
                <Input
                  id="capital"
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  placeholder="10000"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticker" className="text-slate-200">
                  Ticker
                </Label>
                <Input
                  id="ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="SPY"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-slate-200">
                  Precio del ticker ($)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="price"
                    type="number"
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="flex-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                  />
                  <Button
                    onClick={fetchPriceAndATR}
                    disabled={isLoading || !ticker}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      "Obtener precio"
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="atr20" className="text-slate-200">
                  ATR20
                </Label>
                <Input
                  id="atr20"
                  type="number"
                  value={atr20 || ""}
                  onChange={(e) => setAtr20(Number(e.target.value))}
                  placeholder="0.00"
                  step="0.01"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                  readOnly={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="atrMultiplier" className="text-slate-200">
                  Stop Loss = Multiplicador x ATR20
                </Label>
                <Input
                  id="atrMultiplier"
                  type="number"
                  value={atrMultiplier}
                  onChange={(e) => setAtrMultiplier(Number(e.target.value))}
                  placeholder="1"
                  step="0.1"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskPercentage" className="text-slate-200">
                  Riesgo por operación (%)
                </Label>
                <Input
                  id="riskPercentage"
                  type="number"
                  value={riskPercentage}
                  onChange={(e) => setRiskPercentage(Number(e.target.value))}
                  placeholder="1.5"
                  step="0.1"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                />
              </div>
            </div>

            {warning && (
              <Alert className="mt-4 border-amber-500 bg-amber-900/20 text-amber-300">
                <Info className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mt-4 border-red-500 bg-red-900/20 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {usingMockData && price > 0 && (
              <Alert className="mt-4 border-blue-500 bg-blue-900/20 text-blue-300">
                <Info className="h-4 w-4" />
                <AlertTitle>Modo Demo</AlertTitle>
                <AlertDescription>
                  Estás usando datos simulados. Para obtener datos en tiempo real, configura tu clave API de TwelveData
                  en el archivo .env.local:
                  <pre className="mt-2 p-2 bg-slate-800 rounded text-xs overflow-x-auto">
                    TWELVE_DATA_KEY=tu_clave_api_aqui
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={calculateShares}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
            >
              Calcular acciones
            </Button>
            <Button
              onClick={fetchAiAnalysis}
              disabled={isLoadingAnalysis || !isCalculated}
              variant="outline"
              className="w-full border-blue-500 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
            >
              {isLoadingAnalysis ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Obtener análisis IA
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Gráfico de velas */}
        {isLoading ? (
          <Card className="shadow-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Cargando gráfico...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </CardContent>
          </Card>
        ) : showChart ? (
          <CandlestickChart ticker={ticker} data={chartData} isMockData={chartIsMockData} />
        ) : (
          <Card className="shadow-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Gráfico de precios</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-12 text-center text-slate-400">
              <div>
                <p>Haz clic en "Obtener precio" para ver el gráfico de velas del ticker seleccionado.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isCalculated && (
        <Card className="shadow-md bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Resultados</CardTitle>
            <CardDescription className="text-slate-300">
              Basado en tus parámetros de operación para: {getObjectiveLabel(objective)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div className="p-4 rounded-lg bg-slate-700 shadow-sm">
                <div className="text-sm font-medium text-slate-400">Monto a arriesgar</div>
                <div className="text-2xl font-bold text-slate-100">${riskAmount.toFixed(2)}</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-700 shadow-sm">
                <div className="text-sm font-medium text-slate-400">Distancia al SL</div>
                <div className="text-2xl font-bold text-slate-100">${stopLossDistance.toFixed(2)}</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-700 shadow-sm">
                <div className="text-sm font-medium text-slate-400">Número de acciones</div>
                <div className="text-2xl font-bold text-slate-100">{shares}</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-700 shadow-sm">
                <div className="text-sm font-medium text-slate-400">Margen Utilizado</div>
                <div className="text-2xl font-bold text-slate-100">${usedMargin.toFixed(2)}</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-700 shadow-sm">
                <div className="text-sm font-medium text-slate-400">Margen Disponible</div>
                <div className="text-2xl font-bold text-slate-100">${availableMargin.toFixed(2)}</div>
              </div>
            </div>

            {aiAnalysis && (
              <Alert className="mt-4 border-blue-500 bg-blue-900/20 text-blue-300">
                <Brain className="h-4 w-4" />
                <AlertTitle>Análisis del Asesor IA</AlertTitle>
                <AlertDescription>{aiAnalysis}</AlertDescription>
              </Alert>
            )}

            {shares < 1 && (
              <Alert className="mt-4 border-amber-500 bg-amber-900/20 text-amber-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Advertencia</AlertTitle>
                <AlertDescription>
                  El riesgo es demasiado bajo para operar con una acción entera. Considera aumentar el riesgo por
                  operación o usar opciones en su lugar.
                </AlertDescription>
              </Alert>
            )}

            {availableMargin < 0 && (
              <Alert className="mt-4 border-red-500 bg-red-900/20 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Advertencia</AlertTitle>
                <AlertDescription>
                  El margen utilizado excede tu capital disponible. Considera reducir el tamaño de la posición o
                  aumentar tu capital.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card className="shadow-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Historial de operaciones</CardTitle>
            <CardDescription className="text-slate-300">Últimos cálculos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Fecha</TableHead>
                    <TableHead className="text-slate-300">Ticker</TableHead>
                    <TableHead className="text-slate-300">Objetivo</TableHead>
                    <TableHead className="text-slate-300">Capital ($)</TableHead>
                    <TableHead className="text-slate-300">Precio ($)</TableHead>
                    <TableHead className="text-slate-300">ATR</TableHead>
                    <TableHead className="text-slate-300">Riesgo (%)</TableHead>
                    <TableHead className="text-slate-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} className="border-slate-700">
                      <TableCell className="text-slate-300">{item.date.toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-slate-200">{item.ticker}</TableCell>
                      <TableCell className="text-slate-300">{item.objective || "-"}</TableCell>
                      <TableCell className="text-slate-300">${item.capital.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-300">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-slate-300">${item.atr.toFixed(2)}</TableCell>
                      <TableCell className="text-slate-300">{item.risk}%</TableCell>
                      <TableCell className="text-slate-300">{item.shares}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
