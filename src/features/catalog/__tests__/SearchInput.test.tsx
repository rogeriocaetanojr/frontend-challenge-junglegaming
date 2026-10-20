/**
 * Testes unitários para SearchInput (src/features/catalog/SearchInput.tsx).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchInput } from "../SearchInput";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function changeInputValue(input: HTMLInputElement, value: string) {
  const prototype = Object.getPrototypeOf(input);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("SearchInput (src/features/catalog/SearchInput.tsx)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container?.remove();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("deve renderizar o campo com role='searchbox', placeholder e sem botão de limpar quando vazio", async () => {
    const onChangeMock = vi.fn();

    await act(async () => {
      root?.render(
        <SearchInput onChange={onChangeMock} placeholder="Buscar coleções de NFTs..." />,
      );
    });

    const input = container?.querySelector('input[role="searchbox"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toBe("Buscar coleções de NFTs...");
    expect(input.value).toBe("");

    // Botão de limpar não deve estar visível
    const clearBtn = container?.querySelector('button[aria-label="Limpar busca"]');
    expect(clearBtn).toBeNull();
  });

  it("deve renderizar com valor inicial controlado e exibir botão de limpar", async () => {
    const onChangeMock = vi.fn();

    await act(async () => {
      root?.render(<SearchInput value="Cyber Ape" onChange={onChangeMock} />);
    });

    const input = container?.querySelector('input[role="searchbox"]') as HTMLInputElement;
    expect(input.value).toBe("Cyber Ape");

    const clearBtn = container?.querySelector('button[aria-label="Limpar busca"]');
    expect(clearBtn).not.toBeNull();
  });

  it("deve atualizar o feedback visual imediatamente mas disparar onChange apenas após o delayMs de debounce", async () => {
    const onChangeMock = vi.fn();
    const delay = 350;

    await act(async () => {
      root?.render(<SearchInput delayMs={delay} onChange={onChangeMock} />);
    });

    const input = container?.querySelector('input[role="searchbox"]') as HTMLInputElement;

    // Digita no input
    await act(async () => {
      changeInputValue(input, "Jungle");
    });

    // Feedback visual deve ser instantâneo
    expect(input.value).toBe("Jungle");
    // Mas onChange não deve ter sido disparado ainda
    expect(onChangeMock).not.toHaveBeenCalled();

    // Avança tempo parcialmente (200ms)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(onChangeMock).not.toHaveBeenCalled();

    // Avança o restante do delay (150ms -> 350ms total)
    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock).toHaveBeenCalledWith("Jungle");
  });

  it("deve reiniciar o timer caso novas teclas sejam digitadas dentro da janela de debounce", async () => {
    const onChangeMock = vi.fn();

    await act(async () => {
      root?.render(<SearchInput delayMs={300} onChange={onChangeMock} />);
    });

    const input = container?.querySelector('input[role="searchbox"]') as HTMLInputElement;

    await act(async () => {
      changeInputValue(input, "Neo");
    });

    // Avança 200ms (quase no disparo)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(onChangeMock).not.toHaveBeenCalled();

    // Usuário digita mais um caractere
    await act(async () => {
      changeInputValue(input, "Neon");
    });

    // Avança mais 200ms a partir da segunda digitação (o primeiro timer já teria estourado se não fosse reiniciado)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(onChangeMock).not.toHaveBeenCalled();

    // Avança os 100ms finais para completar os 300ms da segunda digitação
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock).toHaveBeenCalledWith("Neon");
  });

  it("deve limpar o input e disparar onChange('') imediatamente ao clicar no botão de limpar", async () => {
    const onChangeMock = vi.fn();

    await act(async () => {
      root?.render(<SearchInput value="Termo para limpar" onChange={onChangeMock} />);
    });

    const input = container?.querySelector('input[role="searchbox"]') as HTMLInputElement;
    const clearBtn = container?.querySelector(
      'button[aria-label="Limpar busca"]',
    ) as HTMLButtonElement;

    expect(clearBtn).not.toBeNull();

    await act(async () => {
      clearBtn.click();
    });

    // Input foi limpo imediatamente
    expect(input.value).toBe("");
    // onChange('') disparado imediatamente sem esperar debounce
    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock).toHaveBeenCalledWith("");
  });

  it("deve limpar o input e disparar onChange('') imediatamente ao pressionar a tecla Escape", async () => {
    const onChangeMock = vi.fn();

    await act(async () => {
      root?.render(<SearchInput value="Busca ativa" onChange={onChangeMock} />);
    });

    const input = container?.querySelector('input[role="searchbox"]') as HTMLInputElement;

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(input.value).toBe("");
    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock).toHaveBeenCalledWith("");
  });
});
