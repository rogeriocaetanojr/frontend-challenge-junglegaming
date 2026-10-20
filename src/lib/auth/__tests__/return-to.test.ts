import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { Route } from "@/routes/_auth";
import { isSafeRedirectPath, sanitizeReturnTo } from "../return-to";

describe("Sanitização de Rotas de Retorno (src/lib/auth/return-to.ts)", () => {
  describe("Caminhos Seguros (Locais)", () => {
    it("deve aceitar caminhos locais simples", () => {
      expect(isSafeRedirectPath("/")).toBe(true);
      expect(sanitizeReturnTo("/")).toBe("/");

      expect(isSafeRedirectPath("/checkout")).toBe(true);
      expect(sanitizeReturnTo("/checkout")).toBe("/checkout");

      expect(isSafeRedirectPath("/market/browse")).toBe(true);
      expect(sanitizeReturnTo("/market/browse")).toBe("/market/browse");
    });

    it("deve preservar parâmetros de busca (query strings) em caminhos seguros", () => {
      const target = "/profile?tab=wallets&network=ethereum";
      expect(isSafeRedirectPath(target)).toBe(true);
      expect(sanitizeReturnTo(target)).toBe(target);
    });

    it("deve preservar fragmentos (hash) em caminhos seguros", () => {
      const target = "/nft/123#bids";
      expect(isSafeRedirectPath(target)).toBe(true);
      expect(sanitizeReturnTo(target)).toBe(target);
    });

    it("deve remover espaços em branco nas extremidades de caminhos seguros", () => {
      expect(sanitizeReturnTo("   /checkout   ")).toBe("/checkout");
    });
  });

  describe("Rejeição de Caminhos Maliciosos e Open Redirects", () => {
    it("deve rejeitar URLs absolutas com protocolo HTTP e HTTPS", () => {
      expect(isSafeRedirectPath("https://evil.com")).toBe(false);
      expect(sanitizeReturnTo("https://evil.com")).toBe("/");

      expect(isSafeRedirectPath("http://phishing.org/login")).toBe(false);
      expect(sanitizeReturnTo("http://phishing.org/login")).toBe("/");

      expect(isSafeRedirectPath("HTTPS://EVIL.COM")).toBe(false);
      expect(sanitizeReturnTo("HTTPS://EVIL.COM")).toBe("/");
    });

    it("deve rejeitar URLs protocol-relative iniciando com barras duplas (//)", () => {
      expect(isSafeRedirectPath("//evil.com")).toBe(false);
      expect(sanitizeReturnTo("//evil.com")).toBe("/");

      expect(isSafeRedirectPath("//evil.com/phishing")).toBe(false);
      expect(sanitizeReturnTo("//evil.com/phishing")).toBe("/");

      expect(isSafeRedirectPath("///evil.com")).toBe(false);
      expect(sanitizeReturnTo("///evil.com")).toBe("/");
    });

    it("deve rejeitar tentativas de evasão com barras invertidas (/\\ ou \\)", () => {
      expect(isSafeRedirectPath("/\\evil.com")).toBe(false);
      expect(sanitizeReturnTo("/\\evil.com")).toBe("/");

      expect(isSafeRedirectPath("\\evil.com")).toBe(false);
      expect(sanitizeReturnTo("\\evil.com")).toBe("/");
    });

    it("deve rejeitar esquemas de execução de script (javascript:, data:, vbscript:)", () => {
      expect(isSafeRedirectPath("javascript:alert(1)")).toBe(false);
      expect(sanitizeReturnTo("javascript:alert(1)")).toBe("/");

      expect(isSafeRedirectPath("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(sanitizeReturnTo("data:text/html,<script>alert(1)</script>")).toBe("/");

      expect(isSafeRedirectPath("vbscript:msgbox(1)")).toBe(false);
      expect(sanitizeReturnTo("vbscript:msgbox(1)")).toBe("/");
    });

    it("deve rejeitar esquemas arbitrários como mailto: ou tel:", () => {
      expect(isSafeRedirectPath("mailto:attacker@evil.com")).toBe(false);
      expect(sanitizeReturnTo("mailto:attacker@evil.com")).toBe("/");
    });
  });

  describe("Validação de Tipos Inválidos e Fallbacks", () => {
    it("deve retornar fallback para strings vazias ou apenas espaços", () => {
      expect(isSafeRedirectPath("")).toBe(false);
      expect(sanitizeReturnTo("")).toBe("/");

      expect(isSafeRedirectPath("   ")).toBe(false);
      expect(sanitizeReturnTo("   ")).toBe("/");
    });

    it("deve retornar fallback para tipos não-string", () => {
      expect(isSafeRedirectPath(null)).toBe(false);
      expect(sanitizeReturnTo(null)).toBe("/");

      expect(isSafeRedirectPath(undefined)).toBe(false);
      expect(sanitizeReturnTo(undefined)).toBe("/");

      expect(isSafeRedirectPath(123)).toBe(false);
      expect(sanitizeReturnTo(123)).toBe("/");

      expect(isSafeRedirectPath({})).toBe(false);
      expect(sanitizeReturnTo({})).toBe("/");

      expect(isSafeRedirectPath([])).toBe(false);
      expect(sanitizeReturnTo([])).toBe("/");

      expect(isSafeRedirectPath(true)).toBe(false);
      expect(sanitizeReturnTo(true)).toBe("/");
    });

    it("deve respeitar fallback customizado quando fornecido", () => {
      expect(sanitizeReturnTo("https://evil.com", "/home")).toBe("/home");
      expect(sanitizeReturnTo("", "/dashboard?tab=assets")).toBe("/dashboard?tab=assets");
      expect(sanitizeReturnTo(null, "/catalog")).toBe("/catalog");
    });

    it("se o próprio fallback fornecido for inseguro, deve aplicar fallback padrão '/'", () => {
      expect(sanitizeReturnTo("https://evil.com", "https://another-evil.com")).toBe("/");
    });
  });

  describe("Integração com Guard de Rota (_auth)", () => {
    type BeforeLoadFn = (args: {
      context?: { auth?: { isAuthenticated?: boolean } };
      location: { pathname: string; search?: string; searchStr?: string };
    }) => void;

    interface RedirectResult {
      options: {
        to: string;
        search?: {
          redirect?: string;
        };
      };
    }

    it("deve disparar redirect para /login com parâmetro redirect sanitizado", () => {
      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;
      expect(beforeLoad).toBeDefined();

      let error: unknown = null;
      try {
        beforeLoad({
          context: { auth: { isAuthenticated: false } },
          location: {
            pathname: "/orders",
            search: "?status=completed",
          },
        });
      } catch (err) {
        error = err;
      }

      expect(isRedirect(error)).toBe(true);
      const redirectResult = error as RedirectResult;
      expect(redirectResult.options.to).toBe("/login");
      expect(redirectResult.options.search?.redirect).toBe("/orders?status=completed");
    });

    it("deve neutralizar tentativa de open redirect ao capturar rota atual no guard", () => {
      const beforeLoad = Route.options.beforeLoad as unknown as BeforeLoadFn;

      let error: unknown = null;
      try {
        beforeLoad({
          context: { auth: { isAuthenticated: false } },
          location: {
            pathname: "//attacker.com",
            search: "",
          },
        });
      } catch (err) {
        error = err;
      }

      expect(isRedirect(error)).toBe(true);
      const redirectResult = error as RedirectResult;
      expect(redirectResult.options.to).toBe("/login");
      expect(redirectResult.options.search?.redirect).toBe("/");
    });
  });
});
