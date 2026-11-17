import path from "node:path";
import { and, asc, eq, isNull } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { conectar, type Db } from "@/db";
import {
  actas,
  actasActivos,
  actasFotos,
  actasVersiones,
  activos,
  asignaciones,
  formatosActa,
  funcionarios,
  ubicaciones,
} from "@/db/schema";
import {
  esquemaDatosBaja,
  esquemaDatosEgreso,
  esquemaDatosEntrega,
} from "@/lib/validacion/actas";
import {
  aplicarFormatoVigente,
  codigoActa,
  crearActa,
  crearActaDeBaja,
  crearActaDeEgreso,
  editarActa,
  FORMATOS_PREDETERMINADOS,
  guardarFormatoActa,
  obtenerFormatoActa,
} from "./actas";
import { asignar, darDeBaja } from "./asignaciones";
import { ErrorDeNegocio } from "./comunes";

let db: Db;

const JPEG = (n: number) => Buffer.from([0xff, 0xd8, 0xff, 0xe0, n]);
const PNG = (n: number) => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, n]);

/** Fotos del acta vigente (versionId null) o de una versión, en orden. */
function fotosDe(actaId: number, versionId: number | null = null) {
  return db
    .select({ contenido: actasFotos.contenido, tipo: actasFotos.tipo, orden: actasFotos.orden })
    .from(actasFotos)
    .where(
      and(
        eq(actasFotos.actaId, actaId),
        versionId === null ? isNull(actasFotos.versionId) : eq(actasFotos.versionId, versionId),
      ),
    )
    .orderBy(asc(actasFotos.orden))
    .all()
    .map((f) => ({ ...f, contenido: [...f.contenido] }));
}

/** Ids de las fotos vigentes del acta, en orden. */
function idsFotos(actaId: number) {
  return db
    .select({ id: actasFotos.id })
    .from(actasFotos)
    .where(and(eq(actasFotos.actaId, actaId), isNull(actasFotos.versionId)))
    .orderBy(asc(actasFotos.orden))
    .all()
    .map((f) => f.id);
}
let funcionario: number;
let pc: number;
let monitor: number;

function datosEntrega(observacion = "") {
  return esquemaDatosEntrega.parse({
    formato: {
      codigo: "F-SIS-002",
      version: "003",
      fechaEmision: "2025-05-15",
      elaborado: {},
      revisado: {},
      aprobado: {},
    },
    responsable: { nombre: "Persona Prueba" },
    perifericos: [],
    torre: {},
    pruebas: [],
    entrega: {},
    observacion,
  });
}

beforeEach(() => {
  db = conectar(":memory:");
  migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  funcionario = db
    .insert(funcionarios)
    .values({ nombre: "Persona Prueba" })
    .returning()
    .get().id;
  pc = db.insert(activos).values({ codigo: "PC-001", tipo: "pc_mesa" }).returning().get().id;
  monitor = db
    .insert(activos)
    .values({ codigo: "MON-001", tipo: "monitor" })
    .returning()
    .get().id;
});

describe("codigoActa", () => {
  it("arma el código con prefijo por tipo y cuatro dígitos", () => {
    expect(codigoActa("entrega", 1)).toBe("ENT-0001");
    expect(codigoActa("egreso", 12)).toBe("EGR-0012");
    expect(codigoActa("baja", 12345)).toBe("BAJ-12345");
  });
});

describe("crearActa", () => {
  it("numera cada tipo por separado y guarda los equipos del acta", () => {
    const primera = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      funcionarioId: funcionario,
      activoIds: [pc, monitor],
      datos: datosEntrega(),
    });
    const segunda = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-17",
      activoIds: [],
      datos: datosEntrega(),
    });

    expect(primera.codigo).toBe("ENT-0001");
    expect(segunda.codigo).toBe("ENT-0002");

    const guardada = db.select().from(actas).where(eq(actas.id, primera.id)).get();
    expect(guardada).toMatchObject({
      tipo: "entrega",
      numero: 1,
      fecha: "2026-11-16",
      funcionarioId: funcionario,
      editadaEn: null,
    });
    expect(guardada?.datos).toEqual(datosEntrega());

    const equipos = db
      .select()
      .from(actasActivos)
      .where(eq(actasActivos.actaId, primera.id))
      .all()
      .map((fila) => fila.activoId)
      .sort();
    expect(equipos).toEqual([pc, monitor].sort());
  });

  it("guarda las fotos en orden con su tipo", () => {
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega(),
      fotos: [
        { contenido: JPEG(1), tipo: "image/jpeg" },
        { contenido: PNG(2), tipo: "image/png" },
      ],
    });
    expect(fotosDe(id)).toEqual([
      { contenido: [...JPEG(1)], tipo: "image/jpeg", orden: 1 },
      { contenido: [...PNG(2)], tipo: "image/png", orden: 2 },
    ]);
  });

  it("rechaza más de 4 fotos sin guardar el acta", () => {
    expect(() =>
      crearActa(db, {
        tipo: "entrega",
        fecha: "2026-11-16",
        activoIds: [],
        datos: datosEntrega(),
        fotos: [1, 2, 3, 4, 5].map((n) => ({ contenido: JPEG(n), tipo: "image/jpeg" })),
      }),
    ).toThrow(new ErrorDeNegocio("El acta admite como máximo 4 fotos"));
    expect(db.select().from(actas).all()).toHaveLength(0);
    expect(db.select().from(actasFotos).all()).toHaveLength(0);
  });

  it("rechaza equipos o funcionarios que no existen sin guardar nada", () => {
    expect(() =>
      crearActa(db, {
        tipo: "entrega",
        fecha: "2026-11-16",
        activoIds: [9999],
        datos: datosEntrega(),
      }),
    ).toThrow(new ErrorDeNegocio("Uno de los equipos no existe"));
    expect(() =>
      crearActa(db, {
        tipo: "entrega",
        fecha: "2026-11-16",
        funcionarioId: 9999,
        activoIds: [],
        datos: datosEntrega(),
      }),
    ).toThrow(new ErrorDeNegocio("El funcionario no existe"));
    expect(db.select().from(actas).all()).toHaveLength(0);
  });

  it("rechaza una fecha mal escrita", () => {
    expect(() =>
      crearActa(db, { tipo: "entrega", fecha: "16/11/2026", activoIds: [], datos: datosEntrega() }),
    ).toThrow(ErrorDeNegocio);
  });
});

describe("editarActa", () => {
  it("guarda la versión anterior completa y marca el acta como editada", () => {
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      funcionarioId: funcionario,
      activoIds: [pc],
      datos: datosEntrega("primera"),
      fotos: [
        { contenido: PNG(1), tipo: "image/png" },
        { contenido: JPEG(2), tipo: "image/jpeg" },
      ],
    });
    const antes = fotosDe(id);

    editarActa(db, {
      id,
      fecha: "2026-11-18",
      activoIds: [monitor],
      datos: datosEntrega("corregida"),
    });

    const acta = db.select().from(actas).where(eq(actas.id, id)).get();
    expect(acta?.fecha).toBe("2026-11-18");
    expect(acta?.funcionarioId).toBeNull();
    expect(acta?.datos).toEqual(datosEntrega("corregida"));
    expect(acta?.numero).toBe(1);
    expect(acta?.editadaEn).toBeInstanceOf(Date);
    // Sin "fotos" en la edición, las fotos se conservan
    expect(fotosDe(id)).toEqual(antes);

    const equipos = db.select().from(actasActivos).where(eq(actasActivos.actaId, id)).all();
    expect(equipos.map((e) => e.activoId)).toEqual([monitor]);

    const versiones = db
      .select()
      .from(actasVersiones)
      .where(eq(actasVersiones.actaId, id))
      .all();
    expect(versiones).toHaveLength(1);
    expect(versiones[0]).toMatchObject({
      fecha: "2026-11-16",
      funcionarioId: funcionario,
      activoIds: [pc],
      datos: datosEntrega("primera"),
    });
    expect(fotosDe(id, versiones[0].id)).toEqual(antes);
  });

  it("cada edición agrega una versión y puede quitar y agregar fotos", () => {
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega("v1"),
      fotos: [1, 2, 3].map((n) => ({ contenido: JPEG(n), tipo: "image/jpeg" })),
    });
    editarActa(db, { id, fecha: "2026-11-16", activoIds: [], datos: datosEntrega("v2") });
    const [primera, , tercera] = idsFotos(id);
    // Conserva la 3.ª y la 1.ª (en ese orden) y agrega una nueva al final
    editarActa(db, {
      id,
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega("v3"),
      fotos: { conservar: [tercera, primera], nuevas: [{ contenido: PNG(9), tipo: "image/png" }] },
    });

    expect(fotosDe(id)).toEqual([
      { contenido: [...JPEG(3)], tipo: "image/jpeg", orden: 1 },
      { contenido: [...JPEG(1)], tipo: "image/jpeg", orden: 2 },
      { contenido: [...PNG(9)], tipo: "image/png", orden: 3 },
    ]);
    const ultimaVersion = db
      .select()
      .from(actasVersiones)
      .where(eq(actasVersiones.actaId, id))
      .orderBy(actasVersiones.id)
      .all()
      .at(-1)!;
    expect(fotosDe(id, ultimaVersion.id).map((f) => f.contenido)).toEqual(
      [1, 2, 3].map((n) => [...JPEG(n)]),
    );

    editarActa(db, {
      id,
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega("v4"),
      fotos: { conservar: [], nuevas: [] },
    });
    expect(fotosDe(id)).toEqual([]);
    const observaciones = db
      .select()
      .from(actasVersiones)
      .where(eq(actasVersiones.actaId, id))
      .orderBy(actasVersiones.id)
      .all()
      .map((v) => (v.datos as { observacion: string }).observacion);
    expect(observaciones).toEqual(["v1", "v2", "v3"]);
  });

  it("sin lista de conservadas agrega las nuevas al final y conserva las guardadas", () => {
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega(),
      fotos: [{ contenido: JPEG(1), tipo: "image/jpeg" }],
    });
    editarActa(db, {
      id,
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega("otra"),
      fotos: { nuevas: [{ contenido: PNG(2), tipo: "image/png" }] },
    });
    expect(fotosDe(id).map((f) => f.contenido)).toEqual([[...JPEG(1)], [...PNG(2)]]);
  });

  it("rechaza pasar de 4 fotos o conservar una foto de otra acta, sin cambiar nada", () => {
    const crearCon = (n: number) =>
      crearActa(db, {
        tipo: "entrega",
        fecha: "2026-11-16",
        activoIds: [],
        datos: datosEntrega(),
        fotos: Array.from({ length: n }, (_, i) => ({ contenido: JPEG(i), tipo: "image/jpeg" })),
      }).id;
    const id = crearCon(3);
    const otra = crearCon(1);
    const editar = (conservar: number[], nuevas: number) =>
      editarActa(db, {
        id,
        fecha: "2026-11-16",
        activoIds: [],
        datos: datosEntrega("cambio"),
        fotos: {
          conservar,
          nuevas: Array.from({ length: nuevas }, () => ({ contenido: PNG(7), tipo: "image/png" })),
        },
      });

    expect(() => editar(idsFotos(id), 2)).toThrow(
      new ErrorDeNegocio("El acta admite como máximo 4 fotos"),
    );
    expect(() => editar([idsFotos(otra)[0]], 0)).toThrow(
      new ErrorDeNegocio("Una de las fotos no pertenece al acta"),
    );
    expect(fotosDe(id)).toHaveLength(3);
    expect(db.select().from(actasVersiones).all()).toHaveLength(0);
  });

  it("no permite cambiar el tipo de un acta ni editar una que no existe", () => {
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega(),
    });
    expect(() =>
      editarActa(db, { id: 9999, fecha: "2026-11-16", activoIds: [], datos: datosEntrega() }),
    ).toThrow(new ErrorDeNegocio("El acta no existe"));
    expect(() =>
      editarActa(db, {
        id,
        tipo: "baja",
        fecha: "2026-11-16",
        activoIds: [],
        datos: datosEntrega(),
      }),
    ).toThrow(new ErrorDeNegocio("No se puede cambiar el tipo de un acta"));
    expect(db.select().from(actasVersiones).all()).toHaveLength(0);
  });
});

describe("formatos de acta", () => {
  it("sin configuración devuelve los datos de los formatos aprobados", () => {
    expect(obtenerFormatoActa(db, "entrega")).toEqual(FORMATOS_PREDETERMINADOS.entrega);
    expect(FORMATOS_PREDETERMINADOS.entrega).toMatchObject({
      codigo: "F-SIS-002",
      version: "003",
      fechaEmision: "2025-05-15",
    });
    expect(FORMATOS_PREDETERMINADOS.egreso).toMatchObject({
      codigo: "F-SIS-001",
      version: "002",
      fechaEmision: "2022-02-23",
    });
    expect(FORMATOS_PREDETERMINADOS.baja).toMatchObject({
      codigo: "FCOM-01",
      version: "002",
      fechaEmision: "2019-06-05",
    });
  });

  it("guarda y lee la configuración de cada formato por separado", () => {
    const egreso = {
      ...FORMATOS_PREDETERMINADOS.egreso,
      version: "003",
      elaborado: { nombre: "Quien Elabora", cargo: "Auxiliar" },
    };
    guardarFormatoActa(db, "egreso", egreso);
    guardarFormatoActa(db, "egreso", egreso); // guardar dos veces actualiza, no duplica

    expect(obtenerFormatoActa(db, "egreso")).toEqual(egreso);
    expect(obtenerFormatoActa(db, "baja")).toEqual(FORMATOS_PREDETERMINADOS.baja);
    expect(db.select().from(formatosActa).all()).toHaveLength(1);
  });
});

describe("aplicarFormatoVigente", () => {
  it("reemplaza el formato del acta por la configuración vigente y guarda la versión anterior", () => {
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      funcionarioId: funcionario,
      activoIds: [pc],
      datos: datosEntrega("sin cambios"),
      fotos: [{ contenido: JPEG(1), tipo: "image/jpeg" }],
    });
    const vigente = {
      ...FORMATOS_PREDETERMINADOS.entrega,
      version: "004",
      elaborado: { nombre: "Quien Elabora", cargo: "Ingeniero" },
    };
    guardarFormatoActa(db, "entrega", vigente);

    aplicarFormatoVigente(db, id);

    const acta = db.select().from(actas).where(eq(actas.id, id)).get()!;
    expect(acta.datos).toEqual({ ...datosEntrega("sin cambios"), formato: vigente });
    expect(acta.fecha).toBe("2026-11-16");
    expect(acta.funcionarioId).toBe(funcionario);
    expect(db.select().from(actasActivos).where(eq(actasActivos.actaId, id)).all()).toHaveLength(1);
    expect(fotosDe(id)).toHaveLength(1);
    const versiones = db.select().from(actasVersiones).where(eq(actasVersiones.actaId, id)).all();
    expect(versiones).toHaveLength(1);
    expect(versiones[0].datos).toEqual(datosEntrega("sin cambios"));
  });

  it("no hace una versión nueva si el acta ya tiene la configuración vigente", () => {
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega(),
    });
    guardarFormatoActa(db, "entrega", datosEntrega().formato);

    expect(() => aplicarFormatoVigente(db, id)).toThrow(
      new ErrorDeNegocio("El acta ya tiene la configuración vigente"),
    );
    expect(() => aplicarFormatoVigente(db, 9999)).toThrow(new ErrorDeNegocio("El acta no existe"));
    expect(db.select().from(actasVersiones).all()).toHaveLength(0);
  });
});

describe("acta de baja", () => {
  function datosBaja() {
    return esquemaDatosBaja.parse({
      formato: FORMATOS_PREDETERMINADOS.baja,
      responsable: {},
      equipo: { elemento: "PC" },
      calificaciones: ["Baja definitiva"],
      diagnostico: {},
      jefeArea: {},
    });
  }

  it("da de baja el equipo y cierra su asignación en la misma operación", () => {
    asignar(db, { activoId: pc, destino: { funcionarioId: funcionario }, fecha: "2026-01-01" });

    const { codigo } = crearActaDeBaja(db, {
      fecha: "2026-11-16",
      activoId: pc,
      funcionarioId: funcionario,
      datos: datosBaja(),
    });

    expect(codigo).toBe("BAJ-0001");
    const equipo = db.select().from(activos).where(eq(activos.id, pc)).get();
    expect(equipo?.estado).toBe("dado_de_baja");
    expect(equipo?.observaciones).toBe("Dado de baja el 16/11/2026: acta BAJ-0001");
    const asignacion = db.select().from(asignaciones).where(eq(asignaciones.activoId, pc)).get();
    expect(asignacion?.fechaHasta).toBe("2026-11-16");
    expect(db.select().from(actasActivos).all()).toEqual([
      { actaId: 1, activoId: pc },
    ]);
  });

  it("si el equipo ya estaba de baja solo guarda el acta", () => {
    darDeBaja(db, { activoId: pc, fecha: "2026-10-01" });
    const antes = db.select().from(activos).where(eq(activos.id, pc)).get();

    crearActaDeBaja(db, { fecha: "2026-11-16", activoId: pc, datos: datosBaja() });

    expect(db.select().from(activos).where(eq(activos.id, pc)).get()).toEqual(antes);
    expect(db.select().from(actas).all()).toHaveLength(1);
  });

  it("si la baja falla no queda el acta", () => {
    expect(() =>
      crearActaDeBaja(db, {
        fecha: "2026-11-16",
        activoId: pc,
        funcionarioId: 9999,
        datos: datosBaja(),
      }),
    ).toThrow(ErrorDeNegocio);
    expect(db.select().from(actas).all()).toHaveLength(0);
    expect(db.select().from(activos).where(eq(activos.id, pc)).get()?.estado).toBe("operativo");
  });
});

describe("acta de egreso", () => {
  let dispensario: number;

  function datosEgreso() {
    return esquemaDatosEgreso.parse({
      formato: FORMATOS_PREDETERMINADOS.egreso,
      funcionarioTi: {},
      dispositivos: [],
      recibe: {},
    });
  }

  beforeEach(() => {
    dispensario = db.insert(ubicaciones).values({ nombre: "DISPENSARIO" }).returning().get().id;
  });

  it("sin traslado solo guarda el acta", () => {
    crearActaDeEgreso(db, {
      fecha: "2026-11-16",
      ubicacionId: dispensario,
      activoIds: [pc],
      trasladar: false,
      datos: datosEgreso(),
    });
    expect(db.select().from(asignaciones).all()).toHaveLength(0);
    expect(db.select().from(actas).get()?.ubicacionId).toBe(dispensario);
  });

  it("con traslado asigna los disponibles y traslada los asignados al destino", () => {
    asignar(db, { activoId: pc, destino: { funcionarioId: funcionario }, fecha: "2026-01-01" });

    const { codigo } = crearActaDeEgreso(db, {
      fecha: "2026-11-16",
      ubicacionId: dispensario,
      activoIds: [pc, monitor],
      trasladar: true,
      datos: datosEgreso(),
    });

    const vigentes = db
      .select()
      .from(asignaciones)
      .where(isNull(asignaciones.fechaHasta))
      .all();
    expect(vigentes).toHaveLength(2);
    for (const vigente of vigentes) {
      expect(vigente).toMatchObject({
        ubicacionId: dispensario,
        funcionarioId: null,
        fechaDesde: "2026-11-16",
        motivo: `Egreso acta ${codigo}`,
      });
    }
    const anterior = db
      .select()
      .from(asignaciones)
      .where(eq(asignaciones.funcionarioId, funcionario))
      .get();
    expect(anterior?.fechaHasta).toBe("2026-11-16");
  });

  it("no incluye equipos dados de baja aunque no se trasladen", () => {
    darDeBaja(db, { activoId: monitor, fecha: "2026-10-01" });
    expect(() =>
      crearActaDeEgreso(db, {
        fecha: "2026-11-16",
        activoIds: [monitor],
        trasladar: false,
        datos: datosEgreso(),
      }),
    ).toThrow(new ErrorDeNegocio("El activo MON-001 está dado de baja"));
    expect(db.select().from(actas).all()).toHaveLength(0);
  });

  it("con traslado deja igual un equipo que ya está en el destino", () => {
    asignar(db, { activoId: pc, destino: { ubicacionId: dispensario }, fecha: "2026-01-01" });
    crearActaDeEgreso(db, {
      fecha: "2026-11-16",
      ubicacionId: dispensario,
      activoIds: [pc],
      trasladar: true,
      datos: datosEgreso(),
    });
    expect(db.select().from(asignaciones).all()).toHaveLength(1);
  });

  it("con traslado exige destino y no deja nada a medias si un equipo está de baja", () => {
    expect(() =>
      crearActaDeEgreso(db, {
        fecha: "2026-11-16",
        activoIds: [pc],
        trasladar: true,
        datos: datosEgreso(),
      }),
    ).toThrow(new ErrorDeNegocio("Elija la ubicación de destino para trasladar los equipos"));

    darDeBaja(db, { activoId: monitor, fecha: "2026-10-01" });
    expect(() =>
      crearActaDeEgreso(db, {
        fecha: "2026-11-16",
        ubicacionId: dispensario,
        activoIds: [pc, monitor],
        trasladar: true,
        datos: datosEgreso(),
      }),
    ).toThrow(new ErrorDeNegocio("El activo MON-001 está dado de baja"));
    expect(db.select().from(actas).all()).toHaveLength(0);
    expect(db.select().from(asignaciones).all()).toHaveLength(0);
  });
});

describe("protecciones del historial", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);

  it("no permite cambiar el equipo de un acta de baja al editarla", () => {
    const datos = esquemaDatosBaja.parse({
      formato: FORMATOS_PREDETERMINADOS.baja,
      responsable: {},
      equipo: {},
      calificaciones: [],
      diagnostico: {},
      jefeArea: {},
    });
    const { id } = crearActaDeBaja(db, { fecha: "2026-11-16", activoId: pc, datos });

    expect(() =>
      editarActa(db, { id, fecha: "2026-11-16", activoIds: [monitor], datos }),
    ).toThrow(new ErrorDeNegocio("No se puede cambiar el equipo de un acta de baja"));
    editarActa(db, { id, fecha: "2026-11-17", activoIds: [pc], datos });
    expect(db.select().from(actas).get()?.fecha).toBe("2026-11-17");
  });

  it("rechaza contenido que no corresponde al tipo del acta", () => {
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega(),
    });
    expect(() =>
      editarActa(db, { id, fecha: "2026-11-16", activoIds: [], datos: { cualquier: "cosa" } }),
    ).toThrow(new ErrorDeNegocio("El contenido del acta no es válido"));
    expect(db.select().from(actasVersiones).all()).toHaveLength(0);
  });

  it("rechaza fotos que no son imágenes o son demasiado grandes sin guardar el acta", () => {
    const crear = (contenido: Buffer, tipo: string) =>
      crearActa(db, {
        tipo: "entrega",
        fecha: "2026-11-16",
        activoIds: [],
        datos: datosEntrega(),
        fotos: [{ contenido, tipo }],
      });

    expect(() => crear(jpeg, "image/gif")).toThrow(
      new ErrorDeNegocio("La foto debe ser JPG, PNG o WEBP"),
    );
    expect(() => crear(Buffer.from("<script>"), "image/jpeg")).toThrow(
      new ErrorDeNegocio("El archivo no es una imagen válida"),
    );
    const enorme = Buffer.concat([jpeg, Buffer.alloc(800 * 1024)]);
    expect(() => crear(enorme, "image/jpeg")).toThrow(
      new ErrorDeNegocio("La foto es demasiado grande"),
    );
    expect(db.select().from(actas).all()).toHaveLength(0);
  });

  it("rechaza una ubicación que no existe", () => {
    expect(() =>
      crearActa(db, {
        tipo: "entrega",
        fecha: "2026-11-16",
        ubicacionId: 9999,
        activoIds: [],
        datos: datosEntrega(),
      }),
    ).toThrow(new ErrorDeNegocio("La ubicación no existe"));
  });
});
