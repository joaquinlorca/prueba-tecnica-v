import type {
  CanalAdquisicion,
  CanalAtencion,
  CasoUso,
  DolorPrincipal,
  Industria,
  Integracion,
  TamanoEmpresa,
} from './taxonomia';

// `label` se muestra en la UI; `descripcion` se inyecta en el prompt del LLM
// para desambiguar categorías cercanas.
export interface EtiquetaCategoria {
  label: string;
  descripcion: string;
}

export const INDUSTRIA_LABELS = {
  salud: {
    label: 'Salud y bienestar',
    descripcion: 'clínicas, consultas médicas o dentales, veterinarias, gimnasios, estudios de yoga, spas',
  },
  educacion: {
    label: 'Educación',
    descripcion: 'colegios, universidades, institutos, academias, cursos online',
  },
  retail: {
    label: 'Retail',
    descripcion: 'tiendas físicas o cadenas de tiendas, aunque también vendan online',
  },
  ecommerce: {
    label: 'E-commerce',
    descripcion: 'negocios que venden principalmente por internet, sin tiendas físicas relevantes',
  },
  gastronomia: {
    label: 'Gastronomía',
    descripcion: 'restaurantes, cafeterías, delivery de comida, catering, panaderías',
  },
  turismo: {
    label: 'Turismo y hotelería',
    descripcion: 'hoteles, agencias de viaje, tours, arriendo de cabañas',
  },
  servicios_profesionales: {
    label: 'Servicios profesionales',
    descripcion: 'estudios legales o contables, consultoras, agencias de marketing, recursos humanos',
  },
  servicios_tecnicos: {
    label: 'Servicios técnicos',
    descripcion: 'talleres mecánicos, mantención, reparaciones, limpieza, instalaciones',
  },
  logistica: {
    label: 'Logística y transporte',
    descripcion: 'envíos, courier, transporte de carga o pasajeros, almacenaje',
  },
  inmobiliaria: {
    label: 'Inmobiliaria y construcción',
    descripcion: 'corredoras de propiedades, inmobiliarias, constructoras, arriendos',
  },
  tecnologia_telecom: {
    label: 'Tecnología y telecom',
    descripcion: 'empresas de software, SaaS, proveedores de internet o telefonía',
  },
  agro: {
    label: 'Agro',
    descripcion: 'agrícolas, viñas, exportadoras de alimentos, insumos agrícolas',
  },
  financiero: {
    label: 'Financiero y seguros',
    descripcion: 'bancos, fintech, aseguradoras, cooperativas de crédito',
  },
  otro: {
    label: 'Otro',
    descripcion: 'ninguna de las anteriores o no se puede determinar',
  },
} satisfies Record<Industria, EtiquetaCategoria>;

export const CANAL_ADQUISICION_LABELS = {
  recomendacion: {
    label: 'Recomendación',
    descripcion: 'un colega, cliente o conocido se lo recomendó personalmente, aunque haya sido en un evento',
  },
  linkedin: {
    label: 'LinkedIn',
    descripcion: 'posts, anuncios o contactos en LinkedIn',
  },
  google_busqueda: {
    label: 'Búsqueda en Google',
    descripcion: 'lo encontró buscando en Google u otro buscador',
  },
  evento_conferencia: {
    label: 'Evento o conferencia',
    descripcion: 'ferias, conferencias, webinars, charlas, meetups',
  },
  podcast: {
    label: 'Podcast',
    descripcion: 'lo escuchó en un podcast',
  },
  redes_sociales: {
    label: 'Redes sociales',
    descripcion: 'Instagram, Facebook, TikTok, YouTube, foros o anuncios en redes (excepto LinkedIn)',
  },
  mailing: {
    label: 'Mailing',
    descripcion: 'correos, newsletters o campañas de email',
  },
  prensa_publicacion: {
    label: 'Prensa o publicación',
    descripcion: 'artículos, revistas, blogs, notas de prensa, casos de estudio publicados',
  },
  otro: {
    label: 'Otro',
    descripcion: 'ninguno de los anteriores o no se menciona',
  },
} satisfies Record<CanalAdquisicion, EtiquetaCategoria>;

export const DOLOR_PRINCIPAL_LABELS = {
  equipo_saturado: {
    label: 'Equipo saturado',
    descripcion: 'el equipo actual no da abasto con el volumen de consultas',
  },
  crecimiento_sin_contratar: {
    label: 'Crecer sin contratar',
    descripcion: 'quiere escalar la atención o expandirse sin aumentar personal',
  },
  consultas_repetitivas: {
    label: 'Consultas repetitivas',
    descripcion: 'pierden tiempo respondiendo siempre las mismas preguntas',
  },
  atencion_fuera_horario: {
    label: 'Atención fuera de horario',
    descripcion: 'necesitan responder de noche, fines de semana o 24/7',
  },
  perdida_ventas_leads: {
    label: 'Pérdida de ventas o leads',
    descripcion: 'pierden clientes o ventas por responder lento o no hacer seguimiento',
  },
  otro: {
    label: 'Otro',
    descripcion: 'ninguno de los anteriores o no se puede determinar',
  },
} satisfies Record<DolorPrincipal, EtiquetaCategoria>;

export const TAMANO_EMPRESA_LABELS = {
  micro: {
    label: 'Micro',
    descripcion: 'emprendimiento o negocio unipersonal, menos de 10 personas, un solo local',
  },
  pequena: {
    label: 'Pequeña',
    descripcion: 'entre 10 y 49 personas o pocas sucursales',
  },
  mediana: {
    label: 'Mediana',
    descripcion: 'entre 50 y 199 personas o varias sucursales en una región',
  },
  grande: {
    label: 'Grande',
    descripcion: '200 o más personas, cadena nacional o presencia en varios países',
  },
} satisfies Record<TamanoEmpresa, EtiquetaCategoria>;

export const CASO_USO_LABELS = {
  agendamiento: {
    label: 'Agendamiento',
    descripcion: 'reservar, confirmar o cancelar citas, clases, mesas o visitas',
  },
  faq: {
    label: 'Preguntas frecuentes',
    descripcion: 'responder dudas sobre horarios, precios, servicios o políticas',
  },
  cotizacion: {
    label: 'Cotización',
    descripcion: 'generar presupuestos o cotizaciones',
  },
  seguimiento_pedidos: {
    label: 'Seguimiento de pedidos',
    descripcion: 'estado de pedidos, tracking de envíos, entregas',
  },
  catalogo_recomendacion: {
    label: 'Catálogo y recomendación',
    descripcion: 'mostrar productos o servicios y recomendar opciones',
  },
  calificacion_leads: {
    label: 'Calificación de leads',
    descripcion: 'filtrar o calificar prospectos antes de pasarlos a ventas',
  },
  derivacion_humano: {
    label: 'Derivación a humano',
    descripcion: 'escalar a una persona los casos complejos o urgentes',
  },
  soporte_postventa: {
    label: 'Soporte postventa',
    descripcion: 'reclamos, devoluciones, garantías, soporte técnico',
  },
} satisfies Record<CasoUso, EtiquetaCategoria>;

export const INTEGRACION_LABELS = {
  crm: {
    label: 'CRM',
    descripcion: 'Salesforce, HubSpot u otro CRM o base de clientes',
  },
  ecommerce: {
    label: 'Plataforma e-commerce',
    descripcion: 'Shopify, WooCommerce, VTEX, tienda online',
  },
  erp_inventario: {
    label: 'ERP o inventario',
    descripcion: 'ERP, SAP, sistema de stock o inventario',
  },
  sistema_reservas: {
    label: 'Sistema de reservas',
    descripcion: 'agenda, software de turnos o citas, PMS hotelero',
  },
  api_propia: {
    label: 'Sistema propio',
    descripcion: 'API o sistema interno propio (ej. rastreo, plataforma propia)',
  },
  pagos: {
    label: 'Pagos',
    descripcion: 'pasarelas de pago, links de pago, facturación',
  },
} satisfies Record<Integracion, EtiquetaCategoria>;

export const CANAL_ATENCION_LABELS = {
  whatsapp: { label: 'WhatsApp', descripcion: 'WhatsApp' },
  instagram: { label: 'Instagram', descripcion: 'Instagram o Facebook Messenger' },
  web: { label: 'Web', descripcion: 'chat en el sitio web' },
  email: { label: 'Email', descripcion: 'correo electrónico' },
  telefono: { label: 'Teléfono', descripcion: 'llamadas telefónicas' },
} satisfies Record<CanalAtencion, EtiquetaCategoria>;
