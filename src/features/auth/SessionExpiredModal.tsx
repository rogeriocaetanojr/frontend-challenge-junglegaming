/**
 * Modal Acessível de Sessão Expirada (SessionExpiredModal).
 *
 * Escuta eventos 'auth:expired' emitidos pelo authEventBus sob expiração de token.
 * Garante:
 * - Limpeza imediata da sessão local (clearSession).
 * - Invalidação e reset do cache do TanStack Query.
 * - Captura e preservação da rota de retorno sanitizada contra Open Redirects.
 * - Acessibilidade WCAG 2.1 AA (role="alertdialog", focus trap, aria-labelledby, aria-describedby).
 * - Ação primária de reconexão redirecionando para /login?redirect=${safeReturnPath}.
 */
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authEventBus, captureReturnTo } from "@/lib/auth/events";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { clearSession } from "@/lib/auth/session-store";
import { queryKeys } from "@/lib/query/keys";

export interface SessionExpiredModalProps {
  /** Callback disparado ao acionar reconexão com a URL de login de destino */
  onReconnect?: (targetUrl: string) => void;
  /** Permite forçar abertura em testes ou storybooks */
  open?: boolean;
  /** Callback para sincronizar alterações no estado aberto/fechado */
  onOpenChange?: (open: boolean) => void;
}

export function SessionExpiredModal({
  onReconnect,
  open: controlledOpen,
  onOpenChange,
}: SessionExpiredModalProps) {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string>("/");

  const isControlled = typeof controlledOpen === "boolean";
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    const unsubscribe = authEventBus.on("auth:expired", (payload) => {
      // 1. Auto logout: remove token do sessionStore
      clearSession();

      // 2. Limpa / reseta o cache de sessão global
      if (queryClient) {
        queryClient.setQueryData(queryKeys.session(), null);
        void queryClient.invalidateQueries({
          queryKey: queryKeys.session(),
        });
      }

      // 3. Captura e sanitiza a rota onde o usuário estava
      const targetPath = payload?.returnTo || captureReturnTo();
      const safePath = sanitizeReturnTo(targetPath, "/");
      setReturnTo(safePath);

      // 4. Abre o modal
      handleOpenChange(true);
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  const handleReconnect = () => {
    const safeTarget = sanitizeReturnTo(returnTo, "/");
    const targetUrl = `/login?redirect=${encodeURIComponent(safeTarget)}`;

    handleOpenChange(false);

    if (onReconnect) {
      onReconnect(targetUrl);
    } else if (typeof window !== "undefined" && window.location) {
      try {
        window.location.assign(targetUrl);
      } catch {
        window.location.href = targetUrl;
      }
    }
  };

  const handleDismiss = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        role="alertdialog"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-description"
        className="border-warning/30 bg-surface-dark max-w-md p-6 sm:p-7"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center sm:items-start sm:text-left">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-warning/10 text-warning border border-warning/20">
            <AlertTriangle className="size-6 stroke-[2]" aria-hidden="true" />
          </div>
          <DialogTitle
            id="session-expired-title"
            className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
          >
            Sessão Expirada
          </DialogTitle>
          <DialogDescription
            id="session-expired-description"
            className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed"
          >
            Sua sessão de autenticação expirou por motivos de segurança ou tempo limite de
            inatividade. Para continuar comprando, vendendo e gerenciando seus NFTs,
            reconecte-se com sua conta.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDismiss}
            className="w-full sm:w-auto text-xs sm:text-sm border-border text-foreground hover:bg-surface-raised"
          >
            Continuar como visitante
          </Button>
          <Button
            type="button"
            onClick={handleReconnect}
            className="w-full sm:w-auto text-xs sm:text-sm bg-primary text-ink-deep hover:bg-primary-dark font-semibold flex items-center justify-center gap-2"
          >
            <LogIn className="size-4" aria-hidden="true" />
            <span>Fazer Login Novamente</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SessionExpiredModal;
