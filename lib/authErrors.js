export class AuthLoginError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AuthLoginError";
    this.code = code;
  }
}
