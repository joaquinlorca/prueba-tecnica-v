import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  analisisReuniones,
  categorias,
  clientes,
  reuniones,
  vendedores,
} from '../db/schema';

// Toda consulta sobre reuniones hace join a clientes y left join a
// analisis_reuniones (puede no estar analizada): es la base que espera construirWhere().
export const joinCliente = eq(clientes.id, reuniones.clienteId);
export const joinAnalisis = eq(analisisReuniones.reunionId, reuniones.id);
export const joinVendedor = eq(vendedores.id, reuniones.vendedorId);

// Una tabla `categorias` por dimensión, para traer los tres nombres en una consulta.
export const catIndustria = alias(categorias, 'cat_industria');
export const catCanal = alias(categorias, 'cat_canal');
export const catDolor = alias(categorias, 'cat_dolor');

export const joinIndustria = eq(catIndustria.id, analisisReuniones.industriaId);
export const joinCanal = eq(catCanal.id, analisisReuniones.canalAdquisicionId);
export const joinDolor = eq(catDolor.id, analisisReuniones.dolorPrincipalId);
