import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { setAuthToken } from "@/lib/http";
import type { UserSession } from "@/types/auth";

export const DEFAULT_MOCK_USER: UserSession = {
  id: "usr_mock_001",
  name: "Alex Vance",
  email: "alex.vance@marketplace.local",
  walletAddress: "0x71C8364437a9C27779976872A42F340a6B233921",
  avatarUrl: "",
  balanceEth: 4.5,
  token: "mock-jwt-token-session-web3",
};

export interface AuthStore {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (mockUser?: Partial<UserSession>) => Promise<void>;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  logout: () => void;
}

/**
 * Store global de autenticação e sessão de carteira Web3.
 * Sincroniza o token com a camada HTTP (Axios) e reage a eventos 401 via auto-logout.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (customUser?: Partial<UserSession>) => {
        const session: UserSession = {
          ...DEFAULT_MOCK_USER,
          ...customUser,
          token: customUser?.token || `mock_jwt_${Date.now()}_session`,
        };

        // Injeta no cliente HTTP isolado
        setAuthToken(session.token);
        set({ user: session, isAuthenticated: true });
      },

      connectWallet: async () => {
        const defaultWallet = "0x71C8364437a9C27779976872A42F340a6B233921";
        const currentUser = get().user;

        if (currentUser) {
          const updatedUser: UserSession = {
            ...currentUser,
            walletAddress: defaultWallet,
            balanceEth: currentUser.balanceEth || 4.5,
          };
          set({ user: updatedUser, isAuthenticated: true });
        } else {
          await get().login({
            walletAddress: defaultWallet,
            balanceEth: 4.5,
          });
        }

        return defaultWallet;
      },

      disconnectWallet: () => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, walletAddress: "", balanceEth: 0 },
          });
        }
      },

      logout: () => {
        setAuthToken(null);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "@nft-marketplace:auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Sincroniza o token no Axios na inicialização / recarregamento da página
        if (state?.user?.token) {
          setAuthToken(state.user.token);
        } else {
          setAuthToken(null);
        }
      },
    },
  ),
);

// Listener reativo de auto-logout para o evento disparado pelo interceptor 401 do HTTP
if (typeof window !== "undefined") {
  window.addEventListener("http:unauthorized", () => {
    useAuthStore.getState().logout();
  });
}
