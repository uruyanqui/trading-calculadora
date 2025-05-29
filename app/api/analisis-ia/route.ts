import { NextRequest, NextResponse } from "next/server"

const ANALYSIS_GUIDELINES: Record<string, string> = {
  preservation: `
    Filosofía de Preservación del Capital:
    - Requiere un capital significativo (idealmente superior a $100,000), ya que su objetivo es mantener valor, no crecer agresivamente.
    - Se busca operar con activos de baja volatilidad y alta reputación: índices amplios, bonos, o empresas sólidas.
    - El uso de stops amplios es común; se toleran movimientos de corto plazo en contra.
    - La diversificación agresiva no es esencial, pero sí la consistencia en el enfoque conservador.
  `,
  income: `
    Filosofía de Generación de Ingresos:
    - Se enfoca en instrumentos que ofrezcan flujo de caja recurrente, como dividendos o intereses.
    - Es compatible con el uso de derivados (ej. opciones) como estrategia complementaria.
    - Se prefiere un riesgo moderado y controlado.
    - El capital puede ser flexible, pero la selección del activo es clave.
  `,
  growth: `
    Filosofía de Crecimiento del Capital:
    - Persigue activos con potencial de apreciación, sin necesidad de flujo de caja inmediato.
    - Requiere tolerancia al riesgo y horizontes temporales más largos.
    - Stops ni muy ajustados ni muy amplios: balance entre protección y oportunidad.
    - Idealmente requiere un capital de al menos $20,000 para permitir cierta flexibilidad.
  `,
  hedging: `
    Filosofía de Cobertura:
    - No persigue retorno directo, sino protección frente a movimientos adversos en otras posiciones.
    - Puede usar acciones, pero suele apoyarse en derivados.
    - Debe existir coherencia entre el activo elegido y el riesgo que se desea cubrir.
    - El capital requerido depende de la exposición que se busca compensar.
  `,
  speculation: `
    Filosofía de Especulación:
    - Enfocada en capturar movimientos rápidos o asimétricos del mercado.
    - Requiere liquidez suficiente y tolerancia a la volatilidad.
    - Stops pueden ser estrechos o amplios según la estrategia, pero siempre claros.
    - El capital mínimo sugerido suele rondar los $5,000 para absorber costos sin distorsión.
  `,
}

async function generateAnalysis(data: any): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim() === "") {
      console.warn("No OpenAI API key found. Using mock analysis.")
      return getMockAnalysis(data)
    }

    const criterio = ANALYSIS_GUIDELINES[data.objective] || ""

    const prompt = `
Eres un asesor financiero especializado en trading. Analiza la siguiente operación teniendo en cuenta la filosofía de su objetivo y los datos aportados. Usa el criterio como una orientación decisiva, pero no argumentes de forma rígida.

${criterio}

Datos de la operación:
- Ticker: ${data.ticker}
- Precio actual: $${data.price}
- Capital disponible: $${data.capital}
- Riesgo por operación: ${data.riskPercentage}%
- ATR20: $${data.atr20}
- Multiplicador de ATR: ${data.atrMultiplier}
- Objetivo de trading: ${data.objectiveLabel || data.objective}
- Número de acciones calculado: ${data.shares}
- Margen utilizado: $${data.usedMargin}

Analiza la conjunción de los parámetros brindados y redacta un consejo profesional, razonado y útil en no más de 3 líneas. Redacta con fluidez y cortesía. Finaliza recomendando consultar con un asesor financiero profesional.
    `.trim()

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    const result = await response.json()

    if (result.choices && result.choices[0]?.message?.content) {
      return result.choices[0].message.content
    }

    console.warn("OpenAI response was invalid or incomplete")
    return getMockAnalysis(data)
  } catch (error) {
    console.error("Error calling OpenAI API:", error)
    return getMockAnalysis(data)
  }
}

function getMockAnalysis(data: any): string {
  const frases = {
    preservation: [
      "Tu capital actual es más bajo de lo usual para una estrategia conservadora. Considera revisar la exposición al riesgo y priorizar activos estables. Consulta con un profesional para adaptar tu enfoque.",
    ],
    income: [
      "El enfoque de ingresos puede ser viable si el activo ofrece pagos periódicos. Evalúa también estrategias con opciones. Siempre es útil validar con un asesor financiero.",
    ],
    growth: [
      "La configuración muestra intención de crecimiento con parámetros razonables. Asegúrate de mantener stops técnicos adecuados y consulta con un profesional para afinar la estrategia.",
    ],
    hedging: [
      "Si esta operación busca cobertura, valida que el activo tenga correlación inversa o baja con tu cartera. Para mayor precisión, consulta con un asesor especializado.",
    ],
    speculation: [
      "Esta operación presenta riesgo acorde a una estrategia especulativa. Cuida el control emocional y los stops definidos. Consulta con un profesional si planeas operar con apalancamiento.",
    ],
  }

  const key = data.objective || "preservation"
  const opciones = frases[key] || frases.preservation
  return opciones[Math.floor(Math.random() * opciones.length)]
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.ticker || !data.price || !data.capital || !data.riskPercentage || !data.atr20) {
      return NextResponse.json({ error: "Faltan datos requeridos para el análisis" }, { status: 400 })
    }

    const objective = data.objective || "preservation"
    const analysis = await generateAnalysis({ ...data, objective })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Error en la ruta /api/analisis-ia:", error)

    return NextResponse.json({
      analysis: getMockAnalysis({ objective: "preservation" }),
      isSimulated: true,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
