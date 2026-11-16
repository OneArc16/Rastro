import { describe, expect, it } from "vitest";
import { esquemaFuncionarioFormulario } from "./funcionarios";

describe("esquemaFuncionarioFormulario", () => {
  const base = { nombre: "Persona Prueba", ubicacionId: "" };

  it("acepta un correo válido y lo deja opcional", () => {
    expect(esquemaFuncionarioFormulario.parse({ ...base, correo: " a@b.co " }).correo).toBe(
      "a@b.co",
    );
    expect(esquemaFuncionarioFormulario.parse({ ...base, correo: "" }).correo).toBeUndefined();
    expect(esquemaFuncionarioFormulario.parse(base).correo).toBeUndefined();
  });

  it("rechaza un correo mal escrito", () => {
    const resultado = esquemaFuncionarioFormulario.safeParse({ ...base, correo: "sin-arroba" });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toBe("El correo no es válido");
  });
});
