// Definicion de las herramientas que el agente de voz (OpenAI Realtime API)
// puede usar durante una llamada en vivo, y el prompt de sistema que le da
// contexto real del negocio. Usado por /api/realtime/session (para armar la
// sesion) y /api/realtime/tools (para ejecutar lo que la IA pida).

export type RealtimeTool = {
  type: 'function'
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description?: string }>
    required?: string[]
  }
}

export const REALTIME_TOOLS: RealtimeTool[] = [
  {
    type: 'function',
    name: 'check_availability',
    description: 'Consulta los horarios disponibles para un servicio en una fecha, opcionalmente con una estilista especifica.',
    parameters: {
      type: 'object',
      properties: {
        service_id: { type: 'string', description: 'ID del servicio (de la lista de servicios que ya tienes en tu contexto)' },
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        stylist_id: { type: 'string', description: 'ID de la estilista, opcional — si no se da, se busca cualquiera disponible' },
      },
      required: ['service_id', 'date'],
    },
  },
  {
    type: 'function',
    name: 'book_appointment',
    description: 'Crea la cita una vez que el cliente eligio un horario devuelto por check_availability y ya tienes su nombre y telefono.',
    parameters: {
      type: 'object',
      properties: {
        service_id: { type: 'string' },
        stylist_id: { type: 'string', description: 'Opcional, "cualquiera disponible" si no se especifica' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        time: { type: 'string', description: 'HH:MM, debe ser uno de los horarios devueltos por check_availability' },
        client_name: { type: 'string' },
        client_phone: { type: 'string' },
      },
      required: ['service_id', 'date', 'time', 'client_name', 'client_phone'],
    },
  },
]

type BusinessCtx = {
  name: string
  services: { id: string; name: string; duration_min: number; price: number }[]
  stylists: { id: string; full_name: string; specialty: string | null }[]
}

export function buildSystemPrompt(ctx: BusinessCtx): string {
  return [
    `Eres la asistente virtual de ${ctx.name}, un salon de uñas, atendiendo una llamada de voz en vivo.`,
    `Habla en español, de forma corta, cálida y natural (esto es una conversación hablada, no un chat de texto — evita listas largas, ve al grano).`,
    `Usa SOLO estos datos reales del negocio, nunca inventes precios ni servicios:`,
    `Servicios: ${JSON.stringify(ctx.services)}`,
    `Estilistas: ${JSON.stringify(ctx.stylists)}`,
    `Si el cliente quiere reservar: pregunta qué servicio quiere, en qué fecha, y si tiene preferencia de estilista.`,
    `Usa check_availability con esos datos para ver horarios reales antes de ofrecer uno.`,
    `Cuando el cliente elija un horario, pide su nombre completo y su número de teléfono, y usa book_appointment para confirmar la cita — nunca digas que una cita quedó reservada sin haber llamado a esa herramienta.`,
    `Si algo falla o no tienes la información, ofrece que te contacten por WhatsApp.`,
  ].join('\n')
}
