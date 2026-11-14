/**
 * Copia de respaldo de la base en data/respaldos/, con fecha y hora en el nombre.
 *
 * Uso: pnpm db:respaldo
 */
import { crearRespaldo } from "../src/db/respaldo";

crearRespaldo()
  .then((destino) => console.log(`Respaldo creado: ${destino}`))
  .catch((error: Error) => {
    console.error(error.message);
    process.exit(1);
  });
