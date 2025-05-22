"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, TrendingUp, Info, RefreshCw } from "lucide-react"
import { useTwelveData } from "@/hooks/use-twelve-data"

interface EnvCheckResult {
  success: boolean
  environment: string
  twelveDataKey: {
    exists: boolean
    length: number | null
    firstChars: string | null
    lastChars: string | null
  }
  timestamp: string
  error?: string
}

export function TwelveDataTest() {
  const [symbol, setSymbol] = useState<string>("MSFT")
  const { data, loading, error, fetchData, clearData } = useTwelveData()
  const [envCheck, setEnvCheck] = useState<EnvCheckResult | null>(null)
  const [checkingEnv, setCheckingEnv] = useState<boolean>(false)
  const [envError, setEnvError] = useState<string | null>(null)

  // Verificar el entorno al cargar el componente
  useEffect(() => {
    checkEnvironment()
  }, [])

  const checkEnvironment = async () => {
    setCheckingEnv(true)
    setEnvError(null)

    try {
      console.log("Checking environment...")
      const response = await fetch("/api/env-check", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      console.log("Environment check response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text.substring(0, 200))
        throw new Error("Server returned non-JSON response")
      }

      const result = await response.json()
      console.log("Environment check result:", result)
      setEnvCheck(result)
    } catch (err) {
      console.error("Error checking environment:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setEnvError(errorMessage)

      // Set a fallback result
      setEnvCheck({
        success: false,
        environment: "unknown",
        twelveDataKey: {
          exists: false,
          length: null,
          firstChars: null,
          lastChars: null,
        },
        timestamp: new Date().toISOString(),
        error: errorMessage,
      })
    } finally {
      setCheckingEnv(false)
    }
  }

  const handleFetch = async () => {
    if (!symbol.trim()) {
      return
    }
    await fetchData(symbol.trim().toUpperCase())
  }

  const handleClear = () => {
    clearData()
    setSymbol("MSFT")
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <TrendingUp className="h-5 w-5" />
          Twelve Data API Test
        </CardTitle>
        <CardDescription className="text-slate-300">
          Prueba la conexión segura con la API de Twelve Data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error de verificación de entorno */}
        {envError && (
          <Alert className="border-red-500 bg-red-900/20 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error verificando entorno</AlertTitle>
            <AlertDescription>
              {envError}
              <Button
                onClick={checkEnvironment}
                variant="outline"
                size="sm"
                className="ml-2 h-6 px-2 text-xs border-red-400 text-red-300 hover:bg-red-900/30"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Información del entorno */}
        {envCheck && !envError && (
          <Alert
            className={
              envCheck.twelveDataKey.exists
                ? "border-blue-500 bg-blue-900/20 text-blue-300"
                : "border-amber-500 bg-amber-900/20 text-amber-300"
            }
          >
            <Info className="h-4 w-4" />
            <AlertTitle>Información del entorno</AlertTitle>
            <AlertDescription>
              <div className="space-y-1 mt-1">
                <div>
                  <strong>Entorno:</strong> {envCheck.environment}
                </div>
                <div>
                  <strong>API Key:</strong> {envCheck.twelveDataKey.exists ? "✅ Configurada" : "❌ No configurada"}
                </div>
                {envCheck.twelveDataKey.exists && (
                  <>
                    <div>
                      <strong>Longitud:</strong> {envCheck.twelveDataKey.length} caracteres
                    </div>
                    <div>
                      <strong>Formato:</strong> {envCheck.twelveDataKey.firstChars} ...{" "}
                      {envCheck.twelveDataKey.lastChars}
                    </div>
                  </>
                )}
                <div>
                  <strong>Timestamp:</strong> {new Date(envCheck.timestamp).toLocaleString()}
                </div>
                {envCheck.error && (
                  <div className="text-red-300">
                    <strong>Error:</strong> {envCheck.error}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario de entrada */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="symbol" className="text-slate-200">
              Símbolo (ej: MSFT, AAPL, GOOGL)
            </Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="MSFT"
              className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
              onKeyPress={(e) => e.key === "Enter" && handleFetch()}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={handleFetch}
              disabled={loading || !symbol.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Obtener datos"
              )}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Limpiar
            </Button>
          </div>
        </div>

        {/* Mostrar errores */}
        {error && (
          <Alert className="border-red-500 bg-red-900/20 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Mostrar datos exitosos */}
        {data && !error && (
          <Alert className="border-green-500 bg-green-900/20 text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Conexión exitosa</AlertTitle>
            <AlertDescription>Datos obtenidos correctamente para {data.meta?.symbol || symbol}</AlertDescription>
          </Alert>
        )}

        {/* Mostrar metadatos */}
        {data?.meta && (
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-100 text-lg">Información del símbolo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Símbolo:</span>
                  <div className="text-slate-100 font-medium">{data.meta.symbol}</div>
                </div>
                <div>
                  <span className="text-slate-400">Tipo:</span>
                  <div className="text-slate-100 font-medium">{data.meta.type}</div>
                </div>
                <div>
                  <span className="text-slate-400">Moneda:</span>
                  <div className="text-slate-100 font-medium">{data.meta.currency}</div>
                </div>
                <div>
                  <span className="text-slate-400">Exchange:</span>
                  <div className="text-slate-100 font-medium">{data.meta.exchange}</div>
                </div>
                <div>
                  <span className="text-slate-400">Intervalo:</span>
                  <div className="text-slate-100 font-medium">{data.meta.interval}</div>
                </div>
                <div>
                  <span className="text-slate-400">Zona horaria:</span>
                  <div className="text-slate-100 font-medium">{data.meta.exchange_timezone}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mostrar datos de precios */}
        {data?.values && data.values.length > 0 && (
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-100 text-lg">
                Datos de precios ({data.values.length} registros)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left text-slate-400 pb-2">Fecha</th>
                      <th className="text-right text-slate-400 pb-2">Apertura</th>
                      <th className="text-right text-slate-400 pb-2">Máximo</th>
                      <th className="text-right text-slate-400 pb-2">Mínimo</th>
                      <th className="text-right text-slate-400 pb-2">Cierre</th>
                      <th className="text-right text-slate-400 pb-2">Volumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.values.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b border-slate-600/50">
                        <td className="text-slate-100 py-2">{item.datetime}</td>
                        <td className="text-slate-100 text-right py-2">${Number(item.open).toFixed(2)}</td>
                        <td className="text-slate-100 text-right py-2">${Number(item.high).toFixed(2)}</td>
                        <td className="text-slate-100 text-right py-2">${Number(item.low).toFixed(2)}</td>
                        <td className="text-slate-100 text-right py-2">${Number(item.close).toFixed(2)}</td>
                        <td className="text-slate-100 text-right py-2">{Number(item.volume).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.values.length > 10 && (
                  <div className="text-center text-slate-400 text-xs mt-2">
                    Mostrando los primeros 10 de {data.values.length} registros
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ejemplo de código */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-100 text-lg">Ejemplo de uso</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-slate-300 bg-slate-800 p-3 rounded overflow-x-auto">
              {`// Ejemplo de uso desde el frontend
const response = await fetch('/api/twelve?symbol=MSFT');
const data = await response.json();

if (data.success) {
  console.log('Datos:', data.data);
  console.log('Meta:', data.data.meta);
  console.log('Valores:', data.data.values);
} else {
  console.error('Error:', data.message);
}`}
            </pre>
          </CardContent>
        </Card>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={checkEnvironment}
          variant="outline"
          size="sm"
          disabled={checkingEnv}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          {checkingEnv ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-3 w-3" />
              Verificar entorno
            </>
          )}
        </Button>

        <div className="text-xs text-slate-400">
          Última actualización: {envCheck ? new Date(envCheck.timestamp).toLocaleTimeString() : "No verificado"}
        </div>
      </CardFooter>
    </Card>
  )
}
