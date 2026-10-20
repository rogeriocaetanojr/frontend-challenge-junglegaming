/**
 * Inicializa a interceptação de requisições pelo Mock Service Worker (MSW)
 * quando a variável VITE_ENABLE_MOCKS estiver configurada como 'true'.
 *
 * Garante inicialização assíncrona e bloqueante antes da montagem da árvore React,
 * prevenindo condições de corrida onde requisições iniciais escapem da interceptação.
 */
export async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS !== "true") {
    return;
  }

  const { startWorker } = await import("./browser");
  await startWorker();
}
