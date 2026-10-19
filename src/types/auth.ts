/**
 * Representa os dados da sessão do usuário autenticado e conectado via carteira Web3.
 */
export interface UserSession {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  avatarUrl?: string;
  balanceEth: number | string;
  token: string;
}
