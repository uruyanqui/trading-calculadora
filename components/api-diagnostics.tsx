"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react"

interface ApiDiagnosticsProps {
  onClose?: () => void
}

export function ApiDiagnostics({ onClose }: ApiDiagnosticsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any>({})

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)

    try {
      // Verificar la configuración del entorno
      const envCheck = await fetch("/api/env-check")
        .then((res) => (res.ok ? res.json() : { success: false, error: `HTTP error ${res.status}` }))
        .catch((err) => ({ success: false, error: err.message }))

      // Verificar la API de precio
      const priceCheck = await fetch("/api/precio?ticker=MSFT")
        .then((res) => (res.ok ? res.json() : { success: false, error: `HTTP error ${res.status}` }))
        .catch((err) => ({ success: false, error: err.message }))

      // Verificar la API de ATR
      const atrCheck = await fetch("/api/atr?ticker=MSFT")
        .then((res) => (res.ok ? res.json() : { success: false, error: `HTTP error ${res.status}` }))
        .catch((err) => ({ success: false, error: err.message }))

      // Verificar la API de datos históricos
      const historicalCheck = await fetch("/api/historico?ticker=MSFT&count=10")
        .then((res) => (res.ok ? res.json() : { success: false, error: `HTTP error ${res.status}` }))
        .catch((err) => ({ success: false, error: err.message }))

      // Verificar la API de twelve
      const twelveCheck = await fetch("/api/twelve?symbol=MSFT")
        .then((res) => (res.ok ? res.json() : { success: false, error: `HTTP error ${res.status}` }))
        .catch((err) => ({ success: false, error: err.message }))

      setResults({
        env: envCheck,
        price: priceCheck,
        atr: atrCheck,
        historical: historicalCheck,
        twelve: twelveCheck,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.error("Error running diagnostics:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al ejecutar diagnósticos")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Ejecutando diagnósticos de API...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-300">Verificando conexiones con la API...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100">Diagnóstico de API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-500 bg-red-900/20 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resumen de resultados */}
        <Alert
          className={
            results.env?.success && results.twelve?.success
              ? "border-green-500 bg-green-900/20 text-green-300"
              : "border-amber-500 bg-amber-900/20 text-amber-300"
          }
        >
          {results.env?.success && results.twelve?.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
          <AlertTitle>Resumen de diagnóstico</AlertTitle>
          <AlertDescription>
            <div className="space-y-1 mt-1">
              <div>
                <strong>Configuración de entorno:</strong>{" "}
                {results.env?.success ? "✅ Correcta" : "❌ Problemas detectados"}
              </div>
              <div>
                <strong>API Twelve Data (prueba):</strong>{" "}
                {results.twelve?.success ? "✅ Funcionando" : "❌ No funciona"}
              </div>
              <div>
                <strong>API de precio:</strong> {results.price && !results.price.error ? "✅ Responde" : "❌ Error"}
                {results.price?.isMockData === true && " (usando datos simulados)"}
              </div>
              <div>
                <strong>API de ATR:</strong> {results.atr && !results.atr.error ? "✅ Responde" : "❌ Error"}
                {results.atr?.isMockData === true && " (usando datos simulados)"}
              </div>
              <div>
                <strong>API de datos históricos:</strong>{" "}
                {results.historical && !results.historical.error ? "✅ Responde" : "❌ Error"}
                {results.historical?.isMockData === true && " (usando datos simulados)"}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Detalles de la configuración de entorno */}
        {results.env && (
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-100 text-lg">Configuración de entorno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Entorno:</span>
                  <div className="text-slate-100">{results.env.environment}</div>
                </div>
                <div>
                  <span className="text-slate-400">API Key:</span>
                  <div className="text-slate-100">
                    {results.env.twelveDataKey?.exists ? "Configurada" : "No configurada"}
                  </div>
                </div>
                {results.env.twelveDataKey?.exists && (
                  <>
                    <div>
                      <span className="text-slate-400">Longitud:</span>
                      <div className="text-slate-100">{results.env.twelveDataKey.length} caracteres</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Formato:</span>
                      <div className="text-slate-100">
                        {results.env.twelveDataKey.firstChars} ... {results.env.twelveDataKey.lastChars}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalles de la API de precio */}
        {results.price && (
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-100 text-lg">API de precio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Ticker:</span>
                  <div className="text-slate-100">{results.price.ticker || "N/A"}</div>
                </div>
                <div>
                  <span className="text-slate-400">Precio:</span>
                  <div className="text-slate-100">
                    {results.price.price ? `$${results.price.price.toFixed(2)}` : "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Datos simulados:</span>
                  <div className="text-slate-100">{results.price.isMockData ? "Sí" : "No"}</div>
                </div>
                {results.price.apiError && (
                  <div>
                    <span className="text-slate-400">Error:</span>
                    <div className="text-red-300">{results.price.apiError}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalles de la API de ATR */}
        {results.atr && (
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-100 text-lg">API de ATR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Ticker:</span>
                  <div className="text-slate-100">{results.atr.ticker || "N/A"}</div>
                </div>
                <div>
                  <span className="text-slate-400">ATR:</span>
                  <div className="text-slate-100">{results.atr.atr ? `$${results.atr.atr.toFixed(2)}` : "N/A"}</div>
                </div>
                <div>
                  <span className="text-slate-400">Datos simulados:</span>
                  <div className="text-slate-100">{results.atr.isMockData ? "Sí" : "No"}</div>
                </div>
                {results.atr.apiError && (
                  <div>
                    <span className="text-slate-400">Error:</span>
                    <div className="text-red-300">{results.atr.apiError}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={runDiagnostics}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Actualizar diagnóstico
        </Button>

        {onClose && (
          <Button onClick={onClose} variant="outline" size="sm" className="border-slate-600 text-slate-300">
            Cerrar
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
