// test
import { parsearCsv } from './cargar-csv';

const ENCABEZADO =
  'Nombre,Correo Electronico,Numero de Telefono,Fecha de la Reunion,Vendedor asignado,closed,Transcripcion';

describe('parsearCsv', () => {
  it('parsea filas con comas y comillas dentro de la transcripción', () => {
    const csv = `${ENCABEZADO}
Ana Pérez,ana@example.com,56912345678,2024-02-15,Tiburón,1,"Somos una clínica, con ""tres"" sedes."
Luis Soto,luis@example.com,,2024-03-01,Toro,0,Tenemos un restaurante.`;

    expect(parsearCsv(csv)).toEqual([
      {
        nombre: 'Ana Pérez',
        email: 'ana@example.com',
        telefono: '56912345678',
        fecha: '2024-02-15',
        vendedor: 'Tiburón',
        closed: true,
        transcripcion: 'Somos una clínica, con "tres" sedes.',
      },
      {
        nombre: 'Luis Soto',
        email: 'luis@example.com',
        telefono: null,
        fecha: '2024-03-01',
        vendedor: 'Toro',
        closed: false,
        transcripcion: 'Tenemos un restaurante.',
      },
    ]);
  });

  it('indica el número de fila cuando closed no es 0 ni 1', () => {
    const csv = `${ENCABEZADO}
Ana,ana@example.com,1,2024-02-15,Toro,1,Hola
Luis,luis@example.com,1,2024-02-15,Toro,2,Hola`;
    expect(() => parsearCsv(csv)).toThrow(/Fila 3/);
  });

  it('rechaza fechas inválidas', () => {
    const csv = `${ENCABEZADO}
Ana,ana@example.com,1,15/02/2024,Toro,1,Hola`;
    expect(() => parsearCsv(csv)).toThrow(/Fila 2/);
  });
});
