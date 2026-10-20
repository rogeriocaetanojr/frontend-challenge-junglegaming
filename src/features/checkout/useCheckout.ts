import { useCallback, useEffect, useRef, useState } from "react";

import { http } from "@/lib/http";
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

/**
 * Hook gerador de máquina de estados de Checkout com idempotência e polling de confirmação.
 */
export function useCheckout(options: UseCheckoutOptions = {}): UseCheckoutReturn {
  const { pollingInterval = 1000, maxPollAttempts = 15, onSuccess, onError } = options;

  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [order, setOrder] = useState<CheckoutOrderResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Gera e persiste chave estável de idempotência para cada ciclo
  const generateKey = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateKey);

  const activePollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

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
            setStatus("success");
            onSuccess?.(currentOrder);
            return;
          }

          if (currentOrder.status === "FAILED") {
            const failErr = new Error("A transação falhou ao ser processada na rede.");
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

  const submitOrder = useCallback(
    async (payload: CreateOrderPayload): Promise<CheckoutOrderResponse | null> => {
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
          setStatus("success");
          onSuccess?.(initialOrder);
          return initialOrder;
        }

        // Inicia polling caso retorne PENDING
        setStatus("polling");
        startPolling(initialOrder.orderId, 0);
        return initialOrder;
      } catch (submitErr: unknown) {
        if (!isMountedRef.current) return null;
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
