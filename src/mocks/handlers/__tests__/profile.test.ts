/**
 * Testes dos handlers REST de perfil, avatar e alteração de senha (MSW v3).
 *
 * Valida consulta de perfil, conflito de e-mail (409), validação de upload de avatar
 * (<= 2MB, formatos permitidos, 422) e alteração de senha com PBKDF2 salgado.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { ApiErrorBody } from "@/contracts/common";
import type { User } from "@/contracts/identity";
import { db, resetDb } from "@/mocks/db";
import { usersRepository } from "@/mocks/db/repositories/users";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api";
const VALID_TOKEN = "mock-token-user_demo";

describe("Profile Handlers (src/mocks/handlers/profile.ts)", () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    resetDb();
    scenarioEngine.reset();
  });

  afterAll(() => {
    server.close();
  });

  describe("GET /api/profile", () => {
    it("deve retornar 401 unauthorized quando cabeçalho Authorization for omitido", async () => {
      const res = await fetch(`${BASE_URL}/profile`);
      expect(res.status).toBe(401);

      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("unauthorized");
    });

    it("deve retornar 401 unauthorized quando token for inválido ou não existir em db.sessions", async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: "Bearer token-inexistente" },
      });
      expect(res.status).toBe(401);

      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("unauthorized");
    });

    it("deve retornar 200 com os dados cadastrais do usuário autenticado", async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${VALID_TOKEN}` },
      });
      expect(res.status).toBe(200);

      const user = (await res.json()) as User;
      expect(user.id).toBe("user_demo");
      expect(user.name).toBe("Alex Jungle");
      expect(user.email).toBe("demo@jungle.com");
      expect(user.avatarUrl).toBeDefined();
      expect((user as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
    });
  });

  describe("PATCH /api/profile", () => {
    it("deve retornar 401 unauthorized sem autenticação", async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alex Updated" }),
      });
      expect(res.status).toBe(401);
    });

    it("deve atualizar nome e bio com sucesso e persistir no banco em memória", async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Alex V2",
          bio: "Web3 NFT Enthusiast & Digital Collector",
        }),
      });

      expect(res.status).toBe(200);
      const user = (await res.json()) as User;
      expect(user.name).toBe("Alex V2");
      expect(user.bio).toBe("Web3 NFT Enthusiast & Digital Collector");

      // Confirma persistência em db.users
      const persisted = db.users.get("user_demo");
      expect(persisted?.name).toBe("Alex V2");
      expect(persisted?.bio).toBe("Web3 NFT Enthusiast & Digital Collector");
    });

    it("deve retornar 409 Conflict com código email_taken quando e-mail já pertencer a outro usuário", async () => {
      // Cria outro usuário no banco
      db.users.set("user_other", {
        id: "user_other" as unknown as User["id"],
        name: "Other User",
        email: "existing@domain.com",
        createdAt: new Date().toISOString() as unknown as User["createdAt"],
        passwordHash: "Password123!",
      });

      const res = await fetch(`${BASE_URL}/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "existing@domain.com",
        }),
      });

      expect(res.status).toBe(409);
      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("email_taken");
      expect(error.message).toContain("já está em uso");
    });

    it("deve permitir atualizar para o mesmo e-mail do próprio usuário sem gerar 409", async () => {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "demo@jungle.com",
        }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/profile/avatar", () => {
    it("deve retornar 401 para tentativa de upload não autenticada", async () => {
      const res = await fetch(`${BASE_URL}/profile/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=",
        }),
      });
      expect(res.status).toBe(401);
    });

    it("deve atualizar avatar com sucesso enviando imagem PNG válida em data URL base64", async () => {
      const pngDataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPifDwAErQG2vNf5twAAAABJRU5ErkJggg==";

      const res = await fetch(`${BASE_URL}/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: pngDataUrl }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { avatarUrl: string; user: User };
      expect(data.avatarUrl).toBe(pngDataUrl);
      expect(data.user.avatarUrl).toBe(pngDataUrl);
      expect(db.users.get("user_demo")?.avatarUrl).toBe(pngDataUrl);
    });

    it("deve atualizar avatar com sucesso enviando imagem WebP válida", async () => {
      const webpDataUrl =
        "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";

      const res = await fetch(`${BASE_URL}/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: webpDataUrl }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { avatarUrl: string };
      expect(data.avatarUrl).toBe(webpDataUrl);
      expect(db.users.get("user_demo")?.avatarUrl).toBe(webpDataUrl);
    });

    it("deve rejeitar com 422 e fieldError quando o formato não for suportado (ex: gif)", async () => {
      const gifDataUrl =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

      const res = await fetch(`${BASE_URL}/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: gifDataUrl }),
      });

      expect(res.status).toBe(422);
      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("validation_error");
      expect(error.fieldErrors?.avatar).toBeDefined();
      expect(error.fieldErrors?.avatar?.[0]).toContain("PNG, JPEG ou WebP");
    });

    it("deve rejeitar com 422 e fieldError quando o tamanho do avatar exceder 2MB", async () => {
      // Cria uma string base64 que excede 2MB (> 2 * 1024 * 1024 bytes)
      // 2MB em base64 requer aprox. 2.8 milhões de caracteres
      const oversizedPayload = "data:image/png;base64," + "A".repeat(2_900_000);

      const res = await fetch(`${BASE_URL}/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: oversizedPayload }),
      });

      expect(res.status).toBe(422);
      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("validation_error");
      expect(error.fieldErrors?.avatar).toBeDefined();
      expect(error.fieldErrors?.avatar?.[0]).toContain("2MB");
    });
  });

  describe("POST /api/profile/password", () => {
    it("deve retornar 401 sem autenticação", async () => {
      const res = await fetch(`${BASE_URL}/profile/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "Password123!",
          newPassword: "NewSecretPassword123!",
        }),
      });
      expect(res.status).toBe(401);
    });

    it("deve retornar 422 quando a senha atual informada for incorreta", async () => {
      const res = await fetch(`${BASE_URL}/profile/password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: "IncorretPassword123!",
          newPassword: "NewPasswordValid123!",
          confirmPassword: "NewPasswordValid123!",
        }),
      });

      expect(res.status).toBe(422);
      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("validation_error");
      expect(error.fieldErrors?.currentPassword).toBeDefined();
      expect(error.fieldErrors?.currentPassword?.[0]).toContain("incorreta");
    });

    it("deve retornar 422 quando a nova senha tiver menos de 8 caracteres", async () => {
      const res = await fetch(`${BASE_URL}/profile/password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: "Password123!",
          newPassword: "short",
          confirmPassword: "short",
        }),
      });

      expect(res.status).toBe(422);
      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("validation_error");
      expect(error.fieldErrors?.newPassword).toBeDefined();
      expect(error.fieldErrors?.newPassword?.[0]).toContain("8 caracteres");
    });

    it("deve retornar 422 quando confirmPassword divergir de newPassword", async () => {
      const res = await fetch(`${BASE_URL}/profile/password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: "Password123!",
          newPassword: "ValidNewPassword123!",
          confirmPassword: "DifferentPassword123!",
        }),
      });

      expect(res.status).toBe(422);
      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("validation_error");
      expect(error.fieldErrors?.confirmPassword).toBeDefined();
      expect(error.fieldErrors?.confirmPassword?.[0]).toContain("não confere");
    });

    it("deve alterar a senha com sucesso e persistir hash PBKDF2 salgado", async () => {
      const newPassword = "UltraSecurePassword2026!";

      const res = await fetch(`${BASE_URL}/profile/password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: "Password123!",
          newPassword,
          confirmPassword: newPassword,
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean; message: string };
      expect(body.success).toBe(true);

      // Validação do hash persistido em db.users
      const updatedUser = db.users.get("user_demo");
      expect(updatedUser?.passwordHash).toMatch(/^pbkdf2\$[0-9a-f]{32}\$[0-9a-f]{64}$/);

      // Valida que a nova senha é aceita pelo algoritmo de verificação
      const isMatch = await usersRepository.verifyPassword(
        newPassword,
        updatedUser!.passwordHash,
      );
      expect(isMatch).toBe(true);

      // Valida que a senha antiga não é mais aceita
      const isOldMatch = await usersRepository.verifyPassword(
        "Password123!",
        updatedUser!.passwordHash,
      );
      expect(isOldMatch).toBe(false);
    });
  });
});
