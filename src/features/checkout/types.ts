/**
 * Definições de tipos e interfaces para o fluxo de Checkout.
 */
export type PaymentMethod = "crypto" | "fiat";

export type CheckoutStatus = "idle" | "submitting" | "polling" | "success" | "error";

export interface BuyerData {
  name: string;
  email: string;
  document?: string;
  walletAddress?: string;
}

export interface CheckoutOrderItem {
  id: string;
  title: string;
  price: number | string;
  quantity: number;
}

export interface CreateOrderPayload {
  buyer: BuyerData;
  paymentMethod: PaymentMethod;
  items: CheckoutOrderItem[];
  totalEth: number | string;
  quoteId?: string;
}

export interface CheckoutOrderResponse {
  orderId: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  idempotencyKey: string;
  createdAt: string;
  transactionHash?: string;
  items?: CheckoutOrderItem[];
  totalEth?: number | string;
  paymentMethod?: PaymentMethod;
}
