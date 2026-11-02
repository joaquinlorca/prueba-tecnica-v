import {
  CANAL_ADQUISICION_LABELS,
  CANAL_ATENCION_LABELS,
  CASO_USO_LABELS,
  DOLOR_PRINCIPAL_LABELS,
  type EtiquetaCategoria,
  INDUSTRIA_LABELS,
  INTEGRACION_LABELS,
  PeriodoVolumenSchema,
  TAMANO_EMPRESA_LABELS,
} from '@vambe/shared';

// Se guarda en respuesta_cruda para saber con qué versión se analizó cada reunión.
export const PROMPT_VERSION = 'v2';

export interface TranscripcionAAnalizar {
  id: number;
  transcripcion: string;
}

const listar = (labels: Record<string, EtiquetaCategoria>) =>
  Object.entries(labels)
    .map(([valor, { descripcion }]) => `  - ${valor}: ${descripcion}`)
    .join('\n');

// Evita que el texto de una transcripción abra o cierre etiquetas <t>.
const escapar = (texto: string) => texto.replace(/</g, '‹').replace(/>/g, '›');

const etiquetar = ({ id, transcripcion }: TranscripcionAAnalizar) =>
  `<t id="${id}">${escapar(transcripcion)}</t>`;

const EJEMPLO_ENTRADA: TranscripcionAAnalizar = {
  id: 0,
  transcripcion:
    'Somos una cadena de retail con 12 sucursales en Santiago. Recibimos entre 800 y 1500 consultas diarias por WhatsApp sobre horarios, disponibilidad de productos y promociones. El volumen es insostenible para nuestro equipo actual. Conocí Vambe a través de LinkedIn mientras buscaba soluciones de automatización. Lo que realmente necesitamos es un chatbot que entienda el contexto de nuestro catálogo, que maneje múltiples canales y que pueda derivar consultas complejas a un humano cuando sea necesario.',
};

const EJEMPLO_SALIDA = [
  {
    id: 0,
    industria: 'retail',
    canal_adquisicion: 'linkedin',
    dolor_principal: 'equipo_saturado',
    tamano_empresa: 'mediana',
    volumen: { min: 800, max: 1500, periodo: 'dia' },
    casos_uso: ['faq', 'catalogo_recomendacion', 'derivacion_humano'],
    integraciones: [],
    canales_atencion: ['whatsapp'],
  },
];

export const construirPrompt = (items: TranscripcionAAnalizar[]): string =>
  `Eres analista de ventas de Vambe, una plataforma de chatbots de atención al cliente con IA.
Vas a recibir ${items.length} transcripciones de reuniones con prospectos. Para CADA una extrae:

industria (exactamente uno):
${listar(INDUSTRIA_LABELS)}

canal_adquisicion: cómo conoció Vambe (exactamente uno):
${listar(CANAL_ADQUISICION_LABELS)}

dolor_principal: el problema que más le urge resolver (exactamente uno):
${listar(DOLOR_PRINCIPAL_LABELS)}

tamano_empresa (uno, o null si no hay pistas):
${listar(TAMANO_EMPRESA_LABELS)}

casos_uso: qué necesita que haga el bot (lista, puede ser vacía):
${listar(CASO_USO_LABELS)}

integraciones: con qué sistemas debe conectarse el bot (lista, puede ser vacía):
${listar(INTEGRACION_LABELS)}

canales_atencion: por dónde le llegan o quiere atender las consultas (lista, puede ser vacía):
${listar(CANAL_ATENCION_LABELS)}

volumen: {"min": número, "max": número, "periodo": ${PeriodoVolumenSchema.options.map((p) => `"${p}"`).join(' | ')}} o null

Reglas:
1. Usa EXACTAMENTE los valores en minúscula de las listas. Nunca inventes valores.
2. dolor_principal: si el cliente no lo dice explícitamente, infiérelo de cómo describe su situación: "constantemente llaman preguntando lo mismo" → consultas_repetitivas; "el equipo no da abasto" → equipo_saturado; "necesitamos atender 24/7, de noche o fines de semana" → atencion_fuera_horario; "estamos creciendo rápido" → crecimiento_sin_contratar; "perdemos clientes por responder tarde" → perdida_ventas_leads. Usa "otro" solo si de verdad ninguno aplica.
3. tamano_empresa: infiérelo de sucursales, empleados, socios, alumnos o volumen. Un solo local o taller sin más datos → micro. Usa null solo si no hay ninguna pista.
4. En industria y canal_adquisicion usa "otro" si no hay evidencia clara; en las listas usa [] si no se menciona nada.
5. volumen es el volumen HABITUAL de consultas. Un rango "entre 800 y 1500" es min 800 y max 1500. Un número aproximado ("unas 400", "más de 400") es min = max = 400. Si solo se menciona un peak puntual (Black Friday, hora punta, consultas por hora), usa null.
6. Responde SOLO con un array JSON, sin texto adicional: un objeto por transcripción, con su "id" numérico.

Ejemplo:
${etiquetar(EJEMPLO_ENTRADA)}
${JSON.stringify(EJEMPLO_SALIDA)}

Transcripciones:
${items.map(etiquetar).join('\n')}`;
