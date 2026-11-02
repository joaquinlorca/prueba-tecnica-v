# Revisión de la categorización del LLM

Muestra **aleatoria y reproducible** de 40 reuniones analizadas (de 1.999), tomada con `setseed(0.42)` + `order by random()` sobre `reuniones` con `estado_analisis = 'ok'`. Cada transcripción se leyó completa y se comparó contra lo que extrajo Gemma 4 (prompt v3).

**Criterio:** ✓ si el valor es correcto o es una inferencia defendible a partir del texto; ✗ si lo contradice o hay una categoría claramente mejor. En tamaño, `—` significa que el modelo devolvió "sin dato" (no se cuenta como error). En integraciones se marca ✗ si falta una que el texto pide o sobra una que no pide.

## Resultado

| Dimensión | Aciertos | Comentario |
|---|---|---|
| Industria | 39 / 40 (97,5%) | El error: una distribuidora mayorista de alimentos clasificada como gastronomía |
| Canal de adquisición | 40 / 40 (100%) | Uno inferido ("encontré Vambe cuando buscaba…" → búsqueda en Google) |
| Dolor principal | 38 / 40 (95%) | 29 de 40 son "consultas repetitivas"; la mayoría son inferencias, no lo dice el cliente |
| Tamaño de empresa | 30 / 32 con valor (94%) | 8 de 40 quedaron sin dato; los 2 errores ignoran el número de personas que da el texto |
| Volumen mensual | 40 / 40 (100%) | Rangos, periodos y peaks bien tratados (por ejemplo, ignora el "se triplica en inscripciones") |
| Integraciones | 37 / 40 (92,5%) | 2 veces faltó "sistema propio" y 1 vez sobró CRM |

## Detalle

| # | Reunión | Negocio | Ind. | Canal | Dolor | Tamaño | Vol. | Integr. | Nota |
|---|---|---|---|---|---|---|---|---|---|
| 1 | #129 | Marketplace de artesanía | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 2 | #136 | Almacén mayorista de abarrotes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Mayorista como retail: defendible |
| 3 | #261 | Gimnasio boutique | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 4 | #266 | Consultora de RR.HH. | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | Puso CRM porque el artículo era "de HubSpot sobre CRM" |
| 5 | #334 | Traducción e interpretación | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | Faltó "sistema propio" (sistema de freelancers) |
| 6 | #414 | Taller automotriz | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 7 | #515 | Clínica psicológica | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | Dolor "equipo saturado" sin respaldo; 5 psicólogos = micro, no pequeña |
| 8 | #538 | Manufactura industrial | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Industria "otro" (no hay manufactura en la taxonomía) |
| 9 | #595 | Joyería de lujo | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 10 | #602 | Energía solar | ✓ | ✓ | ✓ | — | ✓ | ✓ | |
| 11 | #606 | Telecomunicaciones | ✓ | ✓ | ✓ | — | ✓ | ✓ | Con 800 consultas/día podría haber inferido "grande" |
| 12 | #674 | Asesoría fiscal | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 13 | #700 | Fábrica textil | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 14 | #739 | Farmacia con sucursales | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 15 | #815 | Joyería de diamantes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 16 | #895 | Cadena de 8 restaurantes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 17 | #927 | Limpieza industrial | ✓ | ✓ | ✓ | — | ✓ | ✓ | |
| 18 | #962 | Agrotecnología (riego) | ✓ | ✓ | ✓ | — | ✓ | ✓ | |
| 19 | #1009 | Escuela de danza | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Ignoró bien el peak de inscripciones |
| 20 | #1015 | Clínica dental | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 21 | #1021 | Tienda deportiva | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Usó consultas (100–150/día), no transacciones |
| 22 | #1061 | Cosméticos naturales | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 23 | #1071 | Confecciones infantiles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 24 | #1095 | Cadena de 5 restaurantes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 25 | #1100 | Cursos online | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 26 | #1102 | Clínica de ortodoncia | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 27 | #1111 | Turismo corporativo | ✓ | ✓ | ✓ | — | ✓ | ✓ | |
| 28 | #1159 | Software B2B | ✓ | ✓ | ✓ | — | ✓ | ✓ | Dolor "pérdida de leads" bien inferido del pipeline largo |
| 29 | #1233 | Logística | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 30 | #1259 | Joyas artesanales online | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 31 | #1275 | Control de plagas | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Dolor "otro" (generar confianza): defendible |
| 32 | #1333 | E-commerce de ropa | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | Dolor "otro" cuando hay volumen que automatizar |
| 33 | #1460 | Telecom, 500 empleados | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 34 | #1466 | Ropa infantil | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 35 | #1479 | Seguros, 40 corredores | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | 40 personas = pequeña, no mediana |
| 36 | #1491 | Distribuidora de alimentos | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | Gastronomía en vez de "otro"/logística |
| 37 | #1710 | Limpieza de oficinas | ✓ | ✓ | ✓ | — | ✓ | ✓ | |
| 38 | #1725 | Instalación de piscinas | ✓ | ✓ | ✓ | — | ✓ | ✓ | |
| 39 | #1829 | Turismo aventura | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | Faltó "sistema propio" (sistema de guías) |
| 40 | #1938 | Distribuidor de cosméticos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Mayorista como retail: defendible |
