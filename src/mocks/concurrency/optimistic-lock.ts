/**
 * Utilitários de controle de concorrência otimista (Optimistic Concurrency Control - OCC).
 *
 * Fornece validação de versão baseada em contratos e incremento atômico de versões
 * para prevenção de "lost updates" e conflitos de edição concorrente.
 */
import type { ApiErrorBody } from "@/contracts/common";

export interface VersionMismatchError {
  status: 409;
  body: ApiErrorBody & {
    code: "conflict_version_mismatch";
    currentVersion: number;
    expectedVersion?: number;
  };
}

export type VersionValidationResult =
  | {
      success: true;
      nextVersion: number;
      error?: never;
    }
  | {
      success: false;
      nextVersion?: never;
      error: VersionMismatchError;
    };

/**
 * Converte entradas de versão diversas (número, string, ETag HTTP ou nulo)
 * em um número inteiro normalizado.
 */
export function normalizeVersion(version?: number | string | null): number | undefined {
  if (version === null || version === undefined || version === "") {
    return undefined;
  }
  if (typeof version === "number") {
    return Number.isInteger(version) ? version : Math.floor(version);
  }
  // Remove prefixos de ETag como W/" e aspas
  const cleaned = version.replace(/^W\//i, "").replace(/["']/g, "").trim();
  const parsed = parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Valida a versão esperada contra a versão atual da entidade.
 *
 * - Se `expectedVersion` for fornecido e for diferente de `currentVersion`,
 *   retorna erro estruturado com status HTTP 409 e código 'conflict_version_mismatch'.
 * - Se `expectedVersion` coincidir com `currentVersion` (ou não for fornecido),
 *   retorna sucesso e a próxima versão incrementada (`currentVersion + 1`).
 */
export function validateVersion(
  currentVersion: number,
  expectedVersion?: number | string | null,
): VersionValidationResult {
  const normalizedExpected = normalizeVersion(expectedVersion);

  if (normalizedExpected !== undefined && normalizedExpected !== currentVersion) {
    return {
      success: false,
      error: {
        status: 409,
        body: {
          code: "conflict_version_mismatch",
          message: `Conflito de concorrência: o recurso está na versão ${currentVersion}, mas a versão esperada enviada foi ${normalizedExpected}. Atualize os dados antes de reenviar.`,
          currentVersion,
          expectedVersion: normalizedExpected,
        },
      },
    };
  }

  return {
    success: true,
    nextVersion: currentVersion + 1,
  };
}

/**
 * Aplica a validação de bloqueio otimista a uma entidade mutável que contenha `version: number`.
 * Se a validação for bem-sucedida, atualiza `entity.version` com a próxima versão de forma atômica.
 */
export function applyOptimisticLock<T extends { version: number }>(
  entity: T,
  expectedVersion?: number | string | null,
): VersionValidationResult {
  const result = validateVersion(entity.version, expectedVersion);
  if (result.success) {
    entity.version = result.nextVersion;
  }
  return result;
}

/** Exceção lançada em fluxos síncronos quando há divergência de versão. */
export class OptimisticLockError extends Error {
  public readonly status = 409;
  public readonly code = "conflict_version_mismatch" as const;
  public readonly currentVersion: number;
  public readonly expectedVersion?: number;

  constructor(currentVersion: number, expectedVersion?: number) {
    super(
      `Conflito de versão: atual=${currentVersion}, esperada=${expectedVersion ?? "indefinida"}`,
    );
    this.name = "OptimisticLockError";
    this.currentVersion = currentVersion;
    this.expectedVersion = expectedVersion;
  }
}
