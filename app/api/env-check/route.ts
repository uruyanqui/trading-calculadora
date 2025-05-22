import { type NextRequest, NextResponse } from "next/server"

interface EnvCheckResponse {
  success: boolean
  environment: string
  twelveDataKey: {
    exists: boolean
    length: number | null
    firstChars: string | null
    lastChars: string | null
  }
  timestamp: string
}

export async function GET(request: NextRequest) {
  try {
    // Obtener información sobre la clave API de Twelve Data
    const apiKey = process.env.TWELVE_DATA_KEY || ""

    // Crear respuesta segura (sin exponer la clave completa)
    const response: EnvCheckResponse = {
      success: true,
      environment: process.env.NODE_ENV || "unknown",
      twelveDataKey: {
        exists: !!apiKey,
        length: apiKey ? apiKey.length : null,
        firstChars: apiKey && apiKey.length > 4 ? apiKey.substring(0, 4) + "..." : null,
        lastChars: apiKey && apiKey.length > 4 ? "..." + apiKey.substring(apiKey.length - 4) : null,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in env-check API:", error)

    return NextResponse.json(
      {
        success: false,
        environment: process.env.NODE_ENV || "unknown",
        twelveDataKey: {
          exists: false,
          length: null,
          firstChars: null,
          lastChars: null,
        },
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
