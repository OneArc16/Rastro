/**
 * Datos de ejemplo para desarrollo (fase 1).
 * Es idempotente: si ya hay activos registrados no hace nada,
 * para no duplicar ni pisar datos reales.
 *
 * Uso: pnpm db:seed
 */
import { db } from "../src/db";
import {
  activos,
  asignaciones,
  configuracion,
  funcionarios,
  mantenimientos,
  ubicaciones,
} from "../src/db/schema";

function main() {
  const yaHayActivos = db.select({ id: activos.id }).from(activos).limit(1).all();
  if (yaHayActivos.length > 0) {
    console.log("La base ya tiene activos; no se insertan datos de ejemplo.");
    return;
  }

  db.transaction((tx) => {
    // --- Configuración del formato (una sola fila, id = 1) ---
    tx.insert(configuracion)
      .values({
        id: 1,
        codigoFormato: "FT-GT-01",
        versionFormato: "01",
        fechaEmision: "2024-01-15",
        elaboradoNombre: "Daniel Castañeda",
        elaboradoCargo: "Auxiliar de Sistemas",
        revisadoNombre: "Por definir",
        revisadoCargo: "Por definir",
        aprobadoNombre: "Por definir",
        aprobadoCargo: "Por definir",
      })
      .run();

    // --- Ubicaciones ---
    const [lineaFrente, sistemas, contabilidad] = tx
      .insert(ubicaciones)
      .values([
        { nombre: "LINEA DE FRENTE 2do PISO" },
        { nombre: "SISTEMAS 1er PISO" },
        { nombre: "CONTABILIDAD 2do PISO" },
      ])
      .returning()
      .all();

    // --- Funcionarios ---
    const [maria, carlos, lucia] = tx
      .insert(funcionarios)
      .values([
        {
          nombre: "MARIA FERNANDA LOPEZ",
          cargo: "AUXILIAR CONTABLE",
          telefono: "3104567890",
          ubicacionId: contabilidad.id,
        },
        {
          nombre: "CARLOS ANDRES PEREZ",
          cargo: "ASESOR COMERCIAL",
          telefono: "3201234567",
          ubicacionId: lineaFrente.id,
        },
        {
          nombre: "LUCIA GOMEZ RIOS",
          cargo: "AUXILIAR DE SISTEMAS",
          telefono: "3009876543",
          ubicacionId: sistemas.id,
        },
      ])
      .returning()
      .all();

    // --- Activos ---
    const [pcMesa, portatil, monitor1, monitor2, teclado, mouse, impresora] = tx
      .insert(activos)
      .values([
        {
          codigo: "PC-001",
          tipo: "pc_mesa",
          marca: "ASUS",
          modelo: "EXPERTCENTER D500MD",
          serial: "S5N0CV01Z273",
          color: "NEGRO",
          valor: 2850000,
          fechaCompra: "2023-03-10",
          garantiaHasta: "2026-03-10",
          specs: {
            unidadDisco: "SSD",
            capacidadDisco: "512 GB",
            ram: "16 GB",
            tipoRam: "DDR4",
            procesador: "INTEL CORE I5 12400",
            velocidad: "2.50 GHz",
            puertosUsb: 6,
            tarjetaGrafica: { modelo: "INTEL UHD 730", capacidad: "COMPARTIDA" },
            tarjetaWifi: null,
            puertoRed: true,
            tarjetaSonido: "REALTEK HD",
            board: "ASUS PRIME H610M-K",
            sistemaOperativo: "WINDOWS 11 PRO",
            ofimatica: "OFFICE - ADOBE",
            antivirus: "DEFENDER",
          },
          observaciones: "Equipo principal de contabilidad.",
        },
        {
          codigo: "PC-002",
          tipo: "portatil",
          marca: "LENOVO",
          modelo: "THINKPAD E14 GEN 4",
          serial: "PF3XKD7M",
          color: "NEGRO",
          valor: 3450000,
          fechaCompra: "2024-06-20",
          garantiaHasta: "2026-06-20",
          specs: {
            unidadDisco: "SSD",
            capacidadDisco: "256 GB",
            ram: "8 GB",
            tipoRam: "DDR4",
            procesador: "INTEL CORE I5 1235U",
            velocidad: "1.30 GHz",
            puertosUsb: 4,
            tarjetaGrafica: null,
            tarjetaWifi: "INTEL AX201",
            puertoRed: true,
            tarjetaSonido: "REALTEK HD",
            board: "LENOVO ORIGINAL",
            sistemaOperativo: "WINDOWS 11 PRO",
            ofimatica: "OFFICE",
            antivirus: "DEFENDER",
            bateria: { serial: "L21M3PG2", estado: "BUENO" },
          },
        },
        {
          codigo: "MON-0001",
          tipo: "monitor",
          marca: "LG",
          modelo: "22MK400H",
          serial: "202NTAB4X821",
          color: "NEGRO",
          valor: 480000,
          fechaCompra: "2023-03-10",
          specs: { tamano: '22"', tipo: "LED" },
        },
        {
          codigo: "MON-0002",
          tipo: "monitor",
          marca: "SAMSUNG",
          modelo: "LS24C310",
          serial: "0GXTHCPW300215",
          color: "NEGRO",
          valor: 520000,
          fechaCompra: "2024-02-15",
          specs: { tamano: '24"', tipo: "LED" },
        },
        {
          codigo: "TEC-0001",
          tipo: "teclado",
          marca: "GENIUS",
          modelo: "KB-100",
          color: "NEGRO",
          valor: 35000,
          fechaCompra: "2023-03-10",
        },
        {
          codigo: "MOU-0001",
          tipo: "mouse",
          marca: "GENIUS",
          modelo: "DX-110",
          color: "NEGRO",
          valor: 25000,
          fechaCompra: "2023-03-10",
        },
        {
          codigo: "IMP-0001",
          tipo: "impresora",
          marca: "EPSON",
          modelo: "L3250",
          serial: "X644118030",
          color: "NEGRO",
          valor: 890000,
          fechaCompra: "2023-08-01",
          specs: { cableConexion: true, cableEnergia: true },
        },
      ])
      .returning()
      .all();

    // --- Asignaciones ---
    tx.insert(asignaciones)
      .values([
        // Historial: el PC de mesa estuvo antes con Carlos y pasó a María
        {
          activoId: pcMesa.id,
          funcionarioId: carlos.id,
          fechaDesde: "2023-03-15",
          fechaHasta: "2024-01-20",
          motivo: "Asignación inicial",
        },
        {
          activoId: pcMesa.id,
          funcionarioId: maria.id,
          fechaDesde: "2024-01-20",
          motivo: "Cambio de PC",
        },
        { activoId: monitor1.id, funcionarioId: maria.id, fechaDesde: "2024-01-20" },
        { activoId: teclado.id, funcionarioId: maria.id, fechaDesde: "2024-01-20" },
        { activoId: mouse.id, funcionarioId: maria.id, fechaDesde: "2024-01-20" },
        { activoId: portatil.id, funcionarioId: carlos.id, fechaDesde: "2024-06-25", motivo: "Asignación inicial" },
        { activoId: monitor2.id, funcionarioId: lucia.id, fechaDesde: "2024-02-16" },
        // Equipo compartido: la impresora queda asignada a una ubicación
        {
          activoId: impresora.id,
          ubicacionId: contabilidad.id,
          fechaDesde: "2023-08-02",
          motivo: "Impresora compartida del área",
        },
      ])
      .run();

    // --- Mantenimientos ---
    tx.insert(mantenimientos)
      .values([
        {
          activoId: pcMesa.id,
          fecha: "2025-05-10",
          proximaFecha: "2025-11-10",
          tipo: "preventivo",
          observacion: "Limpieza interna y actualización de Windows.",
        },
        {
          activoId: pcMesa.id,
          fecha: "2024-11-05",
          proximaFecha: "2025-05-05",
          tipo: "preventivo",
          observacion: "Limpieza general.",
        },
        {
          activoId: portatil.id,
          fecha: "2025-09-01",
          proximaFecha: "2026-03-01",
          tipo: "preventivo",
          observacion: "Limpieza y revisión de batería.",
        },
        {
          activoId: impresora.id,
          fecha: "2025-10-12",
          tipo: "correctivo",
          observacion: "Cambio de almohadillas y limpieza de cabezales.",
        },
      ])
      .run();
  });

  console.log("Datos de ejemplo insertados correctamente.");
}

main();
