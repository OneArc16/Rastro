import path from "node:path";
import { eq, isNull } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { conectar, type Db } from "@/db";
import {
  actas,
  actasActivos,
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

  it("guarda la foto con su tipo", () => {
    const foto = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega(),
      foto: { contenido: foto, tipo: "image/jpeg" },
    });
    const guardada = db.select().from(actas).where(eq(actas.id, id)).get();
    expect(guardada?.foto?.equals(foto)).toBe(true);
    expect(guardada?.fotoTipo).toBe("image/jpeg");
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
    const foto = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      funcionarioId: funcionario,
      activoIds: [pc],
      datos: datosEntrega("primera"),
      foto: { contenido: foto, tipo: "image/png" },
    });

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
    // Sin "foto" en la edición, la foto se conserva
    expect(acta?.foto?.equals(foto)).toBe(true);

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
      fotoTipo: "image/png",
    });
    expect(versiones[0].foto?.equals(foto)).toBe(true);
  });

  it("cada edición agrega una versión y puede quitar la foto", () => {
    const { id } = crearActa(db, {
      tipo: "entrega",
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega("v1"),
      foto: { contenido: Buffer.from([0xff, 0xd8, 0xff, 1]), tipo: "image/jpeg" },
    });
    editarActa(db, { id, fecha: "2026-11-16", activoIds: [], datos: datosEntrega("v2") });
    editarActa(db, {
      id,
      fecha: "2026-11-16",
      activoIds: [],
      datos: datosEntrega("v3"),
      foto: null,
    });

    const acta = db.select().from(actas).where(eq(actas.id, id)).get();
    expect(acta?.foto).toBeNull();
    expect(acta?.fotoTipo).toBeNull();
    const observaciones = db
      .select()
      .from(actasVersiones)
      .where(eq(actasVersiones.actaId, id))
      .orderBy(actasVersiones.id)
      .all()
      .map((v) => (v.datos as { observacion: string }).observacion);
    expect(observaciones).toEqual(["v1", "v2"]);
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
        foto: { contenido, tipo },
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
