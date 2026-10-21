import { useCallback, useEffect, useRef, useState } from "react";

import { getSession } from "@/lib/auth/session-store";
import { ApiError, http } from "@/lib/http";
import type { CheckoutOrderResponse, CheckoutStatus, CreateOrderPayload } from "./types";

export interface UseCheckoutOptions {
  pollingInterval?: number;
  maxPollAttempts?: number;
  onSuccess?: (order: CheckoutOrderResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseCheckoutReturn {
  status: CheckoutStatus;
  order: CheckoutOrderResponse | null;
  error: Error | null;
  idempotencyKey: string;
  submitOrder: (payload: CreateOrderPayload) => Promise<CheckoutOrderResponse | null>;
  resetCheckout: () => void;
}

const PENDING_ORDER_STORAGE_KEY = "checkout:pending-order";

/** Pedido em andamento: a chave de idempotência e, após a criação, o `orderId`. */
interface PendingOrder {
  userId: string;
  idempotencyKey: string;
  orderId?: string;
}

/** Lê o pedido pendente da sessão do navegador, ignorando o de outro usuário. */
function readPendingOrder(): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingOrder>;
    const userId = getSession()?.userId;
    if (
      !userId ||
      parsed.userId !== userId ||
      typeof parsed.idempotencyKey !== "string"
    ) {
      return null;
    }
    return {
      userId,
      idempotencyKey: parsed.idempotencyKey,
      orderId: typeof parsed.orderId === "string" ? parsed.orderId : undefined,
    };
  } catch {
    return null;
  }
}

function writePendingOrder(idempotencyKey: string, orderId?: string): void {
  const userId = getSession()?.userId;
  if (!userId) return;
  try {
    const pending: PendingOrder = { userId, idempotencyKey, orderId };
    sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Storage indisponível: a recuperação após refresh fica desativada, o fluxo segue
  }
}

function clearPendingOrder(): void {
  try {
    sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
  } catch {
    // Sem storage não há o que limpar
  }
}

/**
 * Hook gerador de máquina de estados de Checkout com idempotência e polling de confirmação.
 */
export function useCheckout(options: UseCheckoutOptions = {}): UseCheckoutReturn {
  const { pollingInterval = 1000, maxPollAttempts = 15, onSuccess, onError } = options;

  // Pedido pendente de um carregamento anterior (refresh ou timeout): retoma em vez de recriar
  const [recovered] = useState<PendingOrder | null>(readPendingOrder);

  const [status, setStatus] = useState<CheckoutStatus>(
    recovered?.orderId ? "polling" : "idle",
  );
  const [order, setOrder] = useState<CheckoutOrderResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Gera e persiste chave estável de idempotência para cada ciclo
  const generateKey = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => recovered?.idempotencyKey ?? generateKey(),
  );

  const activePollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  // Trava síncrona contra reenvio enquanto houver pedido sendo criado ou confirmado
  const inFlightRef = useRef<boolean>(Boolean(recovered?.orderId));

  useEffect(() => {
    if (status !== "submitting" && status !== "polling") {
      inFlightRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (activePollingTimerRef.current) {
        clearTimeout(activePollingTimerRef.current);
      }
    };
  }, []);

  const resetCheckout = useCallback(() => {
    clearPendingOrder();
    if (activePollingTimerRef.current) {
      clearTimeout(activePollingTimerRef.current);
      activePollingTimerRef.current = null;
    }
    setStatus("idle");
    setOrder(null);
    setError(null);
    setIdempotencyKey(generateKey());
  }, []);

  const pollFnRef = useRef<((orderId: string, attempts?: number) => void) | null>(null);

  const startPolling = useCallback(
    (orderId: string, attempts = 0) => {
      if (!isMountedRef.current) return;

      if (attempts >= maxPollAttempts) {
        const timeoutErr = new Error(
          "Tempo limite de confirmação da transação excedido.",
        );
        setError(timeoutErr);
        setStatus("error");
        onError?.(timeoutErr);
        return;
      }

      activePollingTimerRef.current = setTimeout(async () => {
        try {
          const currentOrder = await http.get<CheckoutOrderResponse>(
            `/api/checkout/orders/${orderId}`,
          );

          if (!isMountedRef.current) return;

          setOrder(currentOrder);

          if (currentOrder.status === "CONFIRMED") {
            clearPendingOrder();
            setStatus("success");
            onSuccess?.(currentOrder);
            return;
          }

          if (currentOrder.status === "FAILED") {
            const failErr = new Error("A transação falhou ao ser processada na rede.");
            clearPendingOrder();
            setIdempotencyKey(generateKey());
            setError(failErr);
            setStatus("error");
            onError?.(failErr);
            return;
          }

          // Continua em polling se ainda estiver PENDING
          pollFnRef.current?.(orderId, attempts + 1);
        } catch (pollErr: unknown) {
          if (!isMountedRef.current) return;
          const err =
            pollErr instanceof Error
              ? pollErr
              : new Error("Falha ao consultar estado do pedido.");
          setError(err);
          setStatus("error");
          onError?.(err);
        }
      }, pollingInterval);
    },
    [maxPollAttempts, onError, onSuccess, pollingInterval],
  );

  useEffect(() => {
    pollFnRef.current = startPolling;
  }, [startPolling]);

  useEffect(() => {
    if (recovered?.orderId) pollFnRef.current?.(recovered.orderId, 0);
  }, [recovered]);

  const submitOrder = useCallback(
    async (payload: CreateOrderPayload): Promise<CheckoutOrderResponse | null> => {
      if (inFlightRef.current) return null;
      inFlightRef.current = true;

      writePendingOrder(idempotencyKey);
      setStatus("submitting");
      setError(null);

      try {
        const initialOrder = await http.post<CheckoutOrderResponse>(
          "/api/checkout/orders",
          payload,
          {
            headers: {
              "Idempotency-Key": idempotencyKey,
            },
          },
        );

        if (!isMountedRef.current) return null;

        setOrder(initialOrder);

        if (initialOrder.status === "CONFIRMED") {
          clearPendingOrder();
          setStatus("success");
          onSuccess?.(initialOrder);
          return initialOrder;
        }

        // Inicia polling caso retorne PENDING
        writePendingOrder(idempotencyKey, initialOrder.orderId);
        setStatus("polling");
        startPolling(initialOrder.orderId, 0);
        return initialOrder;
      } catch (submitErr: unknown) {
        if (!isMountedRef.current) return null;
        if (
          submitErr instanceof ApiError &&
          submitErr.statusCode >= 400 &&
          submitErr.statusCode < 500 &&
          submitErr.statusCode !== 408
        ) {
          clearPendingOrder();
          setIdempotencyKey(generateKey());
        }
        const err =
          submitErr instanceof Error
            ? submitErr
            : new Error("Falha ao submeter pedido de checkout.");
        setError(err);
        setStatus("error");
        onError?.(err);
        return null;
      }
    },
    [idempotencyKey, onError, onSuccess, startPolling],
  );

  return {
    status,
    order,
    error,
    idempotencyKey,
    submitOrder,
    resetCheckout,
  };
}

export default useCheckout;
