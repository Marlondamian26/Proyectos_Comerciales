const PASSWORD_MIN_LENGTH = 10;

const LISTA_NEGRA: ReadonlySet<string> = new Set([
  "1234567890",
  "12345678901",
  "0987654321",
  "password123",
  "password1234",
  "qwerty12345",
  "admin12345",
  "admin123456",
  "mipyme1234",
  "cuba123456",
  "habana1234",
  "123456789a",
  "abc1234567",
  "abcdef1234",
  "passw0rd123",
  "contraseña123",
  "1234567890a",
  "qwertyuiop1",
  "letmein1234",
  "welcome1234",
  "iloveyou123",
  "changeme123",
  "monkey12345",
  "dragon12345",
  "master12345",
  "shadow12345",
  "superman123",
  "batman12345",
  "trustno1234",
  "access12345",
  "hello12345",
  "charlie1234",
  "donald12345",
  "michael1234",
  "ashley12345",
  "football12",
  "baseball12",
  "soccer1234",
  "hockey12345",
  "jordan12345",
  "hunter1234",
  "ranger1234",
  "buster1234",
  "harley1234",
  "batman12345678",
  "password1",
  "password123",
  "princess1",
  "sunshine1",
  "qwerty123",
]);

export interface PasswordValidationResult {
  valida: boolean;
  errores: string[];
}

export function validarPassword(password: string): PasswordValidationResult {
  const errores: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errores.push(`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`);
  }

  if (!/[a-zA-Z]/.test(password)) {
    errores.push("Debe contener al menos una letra");
  }

  if (!/[0-9]/.test(password)) {
    errores.push("Debe contener al menos un número");
  }

  if (LISTA_NEGRA.has(password.toLowerCase())) {
    errores.push("Contraseña demasiado común");
  }

  return { valida: errores.length === 0, errores };
}
