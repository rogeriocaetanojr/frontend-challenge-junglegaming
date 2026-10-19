/**
 * Utilitário de parsing e validação de respostas da API com Zod.
 */
import { z } from "zod";

import type { ApiErrorBody } from "@/contracts/common";
import { ApiError } from "@/lib/http/types";

/**
 * Valida os dados de uma resposta HTTP contra um schema Zod.
 * Em caso de inconsistência de schema, converte o `ZodError` em um `ApiError<ApiErrorBody>`
 * padronizado com código `"validation_error"` e status HTTP 422.
 *
 * @param schema Schema Zod tipado contra o contrato esperado
 * @param data Dados brutos recebidos da requisição HTTP
 * @returns Dados validados e tipados conforme o schema
 * @throws {ApiError<ApiErrorBody>} Quando a validação do schema falhar
 */
export function parseResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const path = issue.path.join(".") || "_root";
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }

      const issuesSummary = err.issues
        .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
        .join("; ");

      const errorBody: ApiErrorBody = {
        code: "validation_error",
        message: `Falha na validação do schema da resposta: ${issuesSummary}`,
        fieldErrors,
      };

      throw new ApiError<ApiErrorBody>(errorBody.message, 422, errorBody);
    }

    throw err;
  }
}
