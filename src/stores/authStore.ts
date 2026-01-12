import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario, GabineteSimples } from '../types';

interface AuthState {
  usuario: Usuario | null;
  gabinete: GabineteSimples | null;
  gabinetes: GabineteSimples[];
  subgabinete: GabineteSimples | null;
  subgabinetes: GabineteSimples[];
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
}

interface AuthStore extends AuthState {
  login: (usuario: Usuario, gabinete: GabineteSimples | null, token: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUsuario: (usuario: Partial<Usuario>) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setGabinete: (gabinete: GabineteSimples | null) => void;
  setGabinetes: (gabinetes: GabineteSimples[]) => void;
  setSubgabinete: (subgabinete: GabineteSimples | null) => void;
  setSubgabinetes: (subgabinetes: GabineteSimples[]) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      usuario: null,
      gabinete: null,
      gabinetes: [],
      subgabinete: null,
      subgabinetes: [],
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      login: (usuario, gabinete, token, refreshToken) =>
        set({
          usuario,
          gabinete,
          gabinetes: usuario.gabinetes || [],
          subgabinete: null,
          subgabinetes: usuario.subgabinetes || [],
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          usuario: null,
          gabinete: null,
          gabinetes: [],
          subgabinete: null,
          subgabinetes: [],
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      updateUsuario: (updates) =>
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...updates } : null,
        })),

      setTokens: (token, refreshToken) =>
        set({ token, refreshToken }),

      setGabinete: (gabinete) =>
        set({ gabinete }),

      setGabinetes: (gabinetes) =>
        set({ gabinetes }),

      setSubgabinete: (subgabinete) =>
        set({ subgabinete }),

      setSubgabinetes: (subgabinetes) =>
        set({ subgabinetes }),

      setHasHydrated: (state) =>
        set({ _hasHydrated: state }),
    }),
    {
      name: 'gpvx-auth',
      partialize: (state) => ({
        usuario: state.usuario,
        gabinete: state.gabinete,
        gabinetes: state.gabinetes,
        subgabinete: state.subgabinete,
        subgabinetes: state.subgabinetes,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
