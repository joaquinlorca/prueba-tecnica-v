import type {
  CanalAtencion,
  CasoUso,
  DimensionCategoria,
  EstadoAnalisis,
  Integracion,
  TamanoEmpresa,
} from '@vambe/shared';
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

// Espejo de supabase/migrations/0001_init.sql, que es la fuente de verdad:
// índices y checks viven solo allá. Este schema no se usa para generar migraciones.

export const vendedores = pgTable('vendedores', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull().unique(),
});

export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  email: text('email').notNull(),
  telefono: text('telefono'),
});

export const reuniones = pgTable('reuniones', {
  id: serial('id').primaryKey(),
  clienteId: integer('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  vendedorId: integer('vendedor_id')
    .notNull()
    .references(() => vendedores.id),
  fecha: date('fecha', { mode: 'string' }).notNull(),
  closed: boolean('closed').notNull(),
  transcripcion: text('transcripcion').notNull(),
  estadoAnalisis: text('estado_analisis')
    .$type<EstadoAnalisis>()
    .notNull()
    .default('pendiente'),
});

export const categorias = pgTable(
  'categorias',
  {
    id: serial('id').primaryKey(),
    dimension: text('dimension').$type<DimensionCategoria>().notNull(),
    nombre: text('nombre').notNull(),
  },
  (tabla) => [unique().on(tabla.dimension, tabla.nombre)],
);

export const analisisReuniones = pgTable('analisis_reuniones', {
  id: serial('id').primaryKey(),
  reunionId: integer('reunion_id')
    .notNull()
    .unique()
    .references(() => reuniones.id, { onDelete: 'cascade' }),
  industriaId: integer('industria_id').references(() => categorias.id),
  canalAdquisicionId: integer('canal_adquisicion_id').references(
    () => categorias.id,
  ),
  dolorPrincipalId: integer('dolor_principal_id').references(
    () => categorias.id,
  ),
  volumenMensual: integer('volumen_mensual'),
  tamanoEmpresa: text('tamano_empresa').$type<TamanoEmpresa>(),
  casosUso: text('casos_uso')
    .array()
    .$type<CasoUso[]>()
    .notNull()
    .default(sql`'{}'`),
  integraciones: text('integraciones')
    .array()
    .$type<Integracion[]>()
    .notNull()
    .default(sql`'{}'`),
  canalesAtencion: text('canales_atencion')
    .array()
    .$type<CanalAtencion[]>()
    .notNull()
    .default(sql`'{}'`),
  respuestaCruda: jsonb('respuesta_cruda'),
  creadoEn: timestamp('creado_en', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
