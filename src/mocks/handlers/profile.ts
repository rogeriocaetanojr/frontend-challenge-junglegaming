/**
 * Handlers REST do MSW para consulta e atualização de perfil, avatar e senha.
 *
 * Implementa validação estrita de sessões em memória (db.sessions), verificação
 * de conflito de e-mail (409 email_taken), validação de upload de avatar (<= 2MB,
 * formatos PNG/JPEG/WebP com 422) e hashing salgado PBKDF2 na troca de senha.
 */
import { http, HttpResponse } from "msw";

import type { ApiErrorBody } from "@/contracts/common";
import type { PasswordChange, ProfileUpdate, Session, User } from "@/contracts/identity";
import {
  hashPassword,
  usersRepository,
  verifyPassword,
} from "@/mocks/db/repositories/users";
import { scenarioEngine } from "@/mocks/scenarios";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

/**
 * Extrai a sessão ativa associada ao token Bearer do cabeçalho Authorization.
 */
function getActiveSession(request: Request): Session | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return null;
  }

  return usersRepository.findSessionByToken(token) ?? null;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

/** Resposta padrão para tentativas de acesso não autenticadas ou com token inválido. */
function unauthorizedResponse(): HttpResponse<ApiErrorBody> {
  return HttpResponse.json<ApiErrorBody>(
    {
      code: "unauthorized",
      message: "Acesso não autorizado. Sessão ativa não encontrada ou token inválido.",
    },
    { status: 401 },
  );
}

export const profileHandlers = [
  // 1. Consulta de dados cadastrais do usuário autenticado
  http.get("*/api/profile", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    const user = usersRepository.findById(session.user.id);
    if (!user) {
      return unauthorizedResponse();
    }

    return HttpResponse.json<User>(usersRepository.sanitize(user), { status: 200 });
  }),

  // 2. Atualização parcial do perfil (nome, bio, e-mail)
  http.patch("*/api/profile", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    const user = usersRepository.findById(session.user.id);
    if (!user) {
      return unauthorizedResponse();
    }

    let body: Partial<ProfileUpdate>;
    try {
      body = (await request.json()) as Partial<ProfileUpdate>;
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo JSON inválido." },
        { status: 400 },
      );
    }

    // Se informou um novo e-mail, verifica se já está em uso por outro usuário
    if (body.email) {
      const normalizedEmail = body.email.trim().toLowerCase();
      if (normalizedEmail !== user.email.toLowerCase()) {
        const existing = usersRepository.findByEmail(normalizedEmail);
        if (existing && existing.id !== user.id) {
          return HttpResponse.json<ApiErrorBody>(
            {
              code: "email_taken",
              message: "Este endereço de e-mail já está em uso por outro usuário.",
            },
            { status: 409 },
          );
        }
      }
    }

    const updatedUser = usersRepository.update(user.id, {
      name: body.name,
      email: body.email,
      bio: body.bio,
    });

    if (!updatedUser) {
      return unauthorizedResponse();
    }

    return HttpResponse.json<User>(usersRepository.sanitize(updatedUser), {
      status: 200,
    });
  }),

  // 3. Upload e atualização de avatar
  http.post("*/api/profile/avatar", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    const user = usersRepository.findById(session.user.id);
    if (!user) {
      return unauthorizedResponse();
    }

    const contentType = request.headers.get("content-type") ?? "";
    let dataUrl: string;

    if (contentType.includes("multipart/form-data")) {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        return HttpResponse.json<ApiErrorBody>(
          {
            code: "validation_error",
            message: "Falha ao processar formulário multipart.",
            fieldErrors: { avatar: ["Formulário de upload inválido."] },
          },
          { status: 422 },
        );
      }

      const file = (formData.get("avatar") ?? formData.get("file")) as File | null;
      if (!file || typeof file === "string") {
        return HttpResponse.json<ApiErrorBody>(
          {
            code: "validation_error",
            message: "Nenhum arquivo de avatar enviado.",
            fieldErrors: { avatar: ["O arquivo de avatar é obrigatório."] },
          },
          { status: 422 },
        );
      }

      // Validação do tipo MIME
      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        return HttpResponse.json<ApiErrorBody>(
          {
            code: "validation_error",
            message: "Tipo de arquivo não suportado.",
            fieldErrors: {
              avatar: ["Formato não suportado. Utilize apenas PNG, JPEG ou WebP."],
            },
          },
          { status: 422 },
        );
      }

      // Validação do tamanho
      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        return HttpResponse.json<ApiErrorBody>(
          {
            code: "validation_error",
            message: "Tamanho de imagem superior ao limite permitido de 2MB.",
            fieldErrors: {
              avatar: ["O tamanho da imagem não deve exceder 2MB."],
            },
          },
          { status: 422 },
        );
      }

      const buffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      dataUrl = `data:${file.type};base64,${base64}`;
    } else {
      // Suporte a envio via JSON com data URL base64 ou URL
      let body: {
        avatar?: string;
        dataUrl?: string;
        file?: string;
        type?: string;
        size?: number;
      };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return HttpResponse.json<ApiErrorBody>(
          {
            code: "validation_error",
            message: "Corpo JSON inválido.",
            fieldErrors: { avatar: ["Formato de requisição inválido."] },
          },
          { status: 422 },
        );
      }

      const rawInput = body.avatar ?? body.dataUrl ?? body.file;
      if (!rawInput) {
        return HttpResponse.json<ApiErrorBody>(
          {
            code: "validation_error",
            message: "Dados de avatar ausentes.",
            fieldErrors: { avatar: ["O campo de avatar é obrigatório."] },
          },
          { status: 422 },
        );
      }

      if (rawInput.startsWith("data:")) {
        const matches = rawInput.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches || !matches[1] || !matches[2]) {
          return HttpResponse.json<ApiErrorBody>(
            {
              code: "validation_error",
              message: "Data URL inválida.",
              fieldErrors: { avatar: ["Data URL malformada."] },
            },
            { status: 422 },
          );
        }

        const mimeType = matches[1].toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
          return HttpResponse.json<ApiErrorBody>(
            {
              code: "validation_error",
              message: "Tipo de arquivo não suportado.",
              fieldErrors: {
                avatar: ["Formato não suportado. Utilize apenas PNG, JPEG ou WebP."],
              },
            },
            { status: 422 },
          );
        }

        const base64Data = matches[2];
        const padding = base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0;
        const estimatedSize = Math.floor((base64Data.length * 3) / 4) - padding;

        if (estimatedSize > MAX_AVATAR_SIZE_BYTES) {
          return HttpResponse.json<ApiErrorBody>(
            {
              code: "validation_error",
              message: "Tamanho de imagem superior ao limite permitido de 2MB.",
              fieldErrors: {
                avatar: ["O tamanho da imagem não deve exceder 2MB."],
              },
            },
            { status: 422 },
          );
        }

        dataUrl = rawInput;
      } else {
        // Objeto com metadados ou URL externa
        if (body.type && !ALLOWED_MIME_TYPES.has(body.type.toLowerCase())) {
          return HttpResponse.json<ApiErrorBody>(
            {
              code: "validation_error",
              message: "Tipo de imagem não suportado.",
              fieldErrors: {
                avatar: ["Formato não suportado. Utilize apenas PNG, JPEG ou WebP."],
              },
            },
            { status: 422 },
          );
        }

        if (body.size && body.size > MAX_AVATAR_SIZE_BYTES) {
          return HttpResponse.json<ApiErrorBody>(
            {
              code: "validation_error",
              message: "Tamanho de imagem superior a 2MB.",
              fieldErrors: {
                avatar: ["O tamanho da imagem não deve exceder 2MB."],
              },
            },
            { status: 422 },
          );
        }

        dataUrl = rawInput;
      }
    }

    usersRepository.updateAvatar(user.id, dataUrl);
    const updated = usersRepository.findById(user.id)!;

    return HttpResponse.json(
      {
        avatarUrl: dataUrl,
        user: usersRepository.sanitize(updated),
      },
      { status: 200 },
    );
  }),

  // 4. Alteração de senha do usuário
  http.post("*/api/profile/password", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const session = getActiveSession(request);
    if (!session) {
      return unauthorizedResponse();
    }

    const user = usersRepository.findById(session.user.id);
    if (!user) {
      return unauthorizedResponse();
    }

    let body: Partial<PasswordChange>;
    try {
      body = (await request.json()) as Partial<PasswordChange>;
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo JSON inválido." },
        { status: 400 },
      );
    }

    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;

    // 1. Validação da senha atual
    if (!currentPassword) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "Senha atual é obrigatória.",
          fieldErrors: {
            currentPassword: ["A senha atual é obrigatória."],
          },
        },
        { status: 422 },
      );
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "A senha atual informada está incorreta.",
          fieldErrors: {
            currentPassword: ["A senha atual informada está incorreta."],
          },
        },
        { status: 422 },
      );
    }

    // 2. Validação da nova senha (mínimo de 8 caracteres)
    if (!newPassword || newPassword.length < 8) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "A nova senha deve ter no mínimo 8 caracteres.",
          fieldErrors: {
            newPassword: ["A nova senha deve ter no mínimo 8 caracteres."],
          },
        },
        { status: 422 },
      );
    }

    // 3. Validação de confirmação de senha
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return HttpResponse.json<ApiErrorBody>(
        {
          code: "validation_error",
          message: "A confirmação de senha não confere com a nova senha.",
          fieldErrors: {
            confirmPassword: ["A confirmação de senha não confere com a nova senha."],
          },
        },
        { status: 422 },
      );
    }

    // 4. Gera hash salgado PBKDF2 e atualiza no banco
    const saltedHash = await hashPassword(newPassword);
    usersRepository.updatePassword(user.id, saltedHash);

    return HttpResponse.json(
      {
        success: true,
        message: "Senha atualizada com sucesso.",
      },
      { status: 200 },
    );
  }),
];
