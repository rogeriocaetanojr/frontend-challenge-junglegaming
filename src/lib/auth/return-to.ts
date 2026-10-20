/**
 * Sanitizador de Rotas de Retorno (Prevenção de Open Redirects).
 *
 * Garante que apenas caminhos locais e seguros relativos à aplicação sejam
 * utilizados após fluxos de login ou expiração de sessão.
 */

const DUMMY_BASE_ORIGIN = "http://localhost";
const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/**
 * Previne caracteres de controle ASCII não-imprimíveis (\x00-\x1F e \x7F).
 */
function hasControlChars(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      return true;
    }
  }
  return false;
}

/**
 * Valida se um valor de entrada representa um caminho de redirecionamento seguro.
 */
export function isSafeRedirectPath(target: unknown): target is string {
  if (typeof target !== "string") {
    return false;
  }

  const trimmed = target.trim();

  // Rejeita strings vazias ou caminhos que não iniciam com barra única
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return false;
  }

  // Previne evasão com barras invertidas (ex: /\evil.com)
  if (trimmed.includes("\\")) {
    return false;
  }

  // Previne URLs com schemes (http:, https:, javascript:, data:, etc.)
  if (SCHEME_REGEX.test(trimmed)) {
    return false;
  }

  // Previne caracteres de controle
  if (hasControlChars(trimmed)) {
    return false;
  }

  try {
    const url = new URL(trimmed, DUMMY_BASE_ORIGIN);
    // Garante que o origin permaneceu no host base seguro e sem credenciais
    if (url.origin !== DUMMY_BASE_ORIGIN || url.username || url.password) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitiza o caminho de redirecionamento contra ataques de Open Redirect.
 *
 * @param target Caminho de destino fornecido pelo usuário ou query param
 * @param fallback Caminho padrão caso o target seja inválido ou malicioso (padrão '/')
 * @returns Caminho seguro relativo (ex: '/checkout', '/profile?tab=wallets')
 */
export function sanitizeReturnTo(target: unknown, fallback = "/"): string {
  const safeFallback = isSafeRedirectPath(fallback) ? fallback.trim() : "/";

  if (!isSafeRedirectPath(target)) {
    return safeFallback;
  }

  const trimmed = target.trim();
  try {
    const parsed = new URL(trimmed, DUMMY_BASE_ORIGIN);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return safeFallback;
  }
}
