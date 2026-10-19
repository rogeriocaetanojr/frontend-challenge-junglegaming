/**
 * Inicializa a interceptação de requisições pelo Mock Service Worker (MSW)
 * quando a variável VITE_ENABLE_MOCKS estiver configurada como 'true'.
 */
export async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS !== "true") {
    return;
  }

  const { worker } = await import("./browser");

  await worker.start({
    onUnhandledFrame: "bypass",
  });
}
