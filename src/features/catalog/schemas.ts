/**
 * Schemas Zod de Validação e Coerção de Parâmetros de Busca do Catálogo.
 *
 * Garante tipagem estrita, coerção segura e sanitização contra inputs maliciosos
 * ou inválidos via query params (TanStack Router).
 */
import { z } from "zod";

export const catalogSortBySchema = z
  .enum(["price", "createdAt", "name", "title"])
  .or(z.string());

export const sortDirectionSchema = z.enum(["asc", "desc"]);

/**
 * Schema principal para sincronização de search params com o TanStack Router.
 */
export const catalogSearchSchema = z.object({
  q: z
    .preprocess((val) => {
      if (typeof val !== "string") return undefined;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }, z.string().optional())
    .optional(),
  category: z
    .preprocess((val) => {
      if (typeof val !== "string") return undefined;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }, z.string().optional())
    .optional(),
  minPrice: z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = typeof val === "number" ? val : Number(val);
      return isNaN(num) || num < 0 ? undefined : num;
    }, z.number().min(0).optional())
    .optional(),
  maxPrice: z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = typeof val === "number" ? val : Number(val);
      return isNaN(num) || num < 0 ? undefined : num;
    }, z.number().min(0).optional())
    .optional(),
  sortBy: catalogSortBySchema.optional(),
  sortDirection: sortDirectionSchema.optional(),
  page: z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) return 1;
      const num = typeof val === "number" ? val : Number(val);
      return isNaN(num) || num < 1 ? 1 : Math.floor(num);
    }, z.number().int().positive().default(1))
    .default(1),
  limit: z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) return 12;
      const num = typeof val === "number" ? val : Number(val);
      return isNaN(num) || num < 1 ? 12 : Math.floor(num);
    }, z.number().int().positive().default(12))
    .default(12),
});

export type CatalogSearchParams = z.infer<typeof catalogSearchSchema>;
export type CatalogSearch = CatalogSearchParams;

/**
 * Função utilitária de sanitização e valores padrão para o validateSearch do router.
 */
export function parseCatalogSearch(rawSearch: unknown): CatalogSearchParams {
  const result = catalogSearchSchema.safeParse(rawSearch ?? {});
  if (result.success) {
    return result.data;
  }
  return {
    page: 1,
    limit: 12,
  };
}
