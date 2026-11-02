-- 0001_init.sql
create table vendedores (
  id      serial primary key,
  nombre  text not null unique
);

create table clientes (
  id        serial primary key,
  nombre    text not null,
  email     text not null,
  telefono  text
);

create table reuniones (
  id               serial primary key,
  cliente_id       int not null references clientes(id) on delete cascade,
  vendedor_id      int not null references vendedores(id),
  fecha            date not null,
  closed           boolean not null,
  transcripcion    text not null,
  estado_analisis  text not null default 'pendiente'
                   check (estado_analisis in ('pendiente','ok','error'))
);

create table categorias (
  id         serial primary key,
  dimension  text not null check (dimension in ('industria','canal_adquisicion','dolor_principal')),
  nombre     text not null,
  unique (dimension, nombre)
);

create table analisis_reuniones (
  id                    serial primary key,
  reunion_id            int not null unique references reuniones(id) on delete cascade,
  industria_id          int references categorias(id),
  canal_adquisicion_id  int references categorias(id),
  dolor_principal_id    int references categorias(id),
  volumen_mensual       int check (volumen_mensual >= 0),
  tamano_empresa        text check (tamano_empresa in ('micro','pequena','mediana','grande')),
  casos_uso             text[] not null default '{}',
  integraciones         text[] not null default '{}',
  canales_atencion      text[] not null default '{}',
  respuesta_cruda       jsonb,
  creado_en             timestamptz not null default now()
);

create index on reuniones (vendedor_id);
create index on reuniones (cliente_id);
create index on reuniones (fecha);
create index on reuniones (estado_analisis);
create index on analisis_reuniones (industria_id);
create index on analisis_reuniones (canal_adquisicion_id);
create index on analisis_reuniones (dolor_principal_id);
create index on analisis_reuniones using gin (casos_uso);
create index on analisis_reuniones using gin (integraciones);
create index on analisis_reuniones using gin (canales_atencion);

alter table vendedores          enable row level security;
alter table clientes            enable row level security;
alter table reuniones           enable row level security;
alter table categorias          enable row level security;
alter table analisis_reuniones  enable row level security;
