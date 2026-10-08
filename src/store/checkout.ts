import { create } from 'zustand';
import type { PaymentMethod } from '../types';

export type PaymentStage = 'idle' | 'busy' | 'waiting' | 'done' | 'failed';

export type Payment = {
  stage: PaymentStage;
  txId?: string;
  expiresAt?: string;
  /** Récapitulatif figé au moment de la demande (pour l'attente et le succès). */
  amount?: number;
  phone?: string;
  eventId?: string;
  count?: number;
  ticketRef?: string;
  error?: string;
};

type CheckoutStore = {
  buyer: { name: string; phone: string };
  method: PaymentMethod;
  payment: Payment;
  setBuyer: (b: Partial<CheckoutStore['buyer']>) => void;
  setMethod: (m: PaymentMethod) => void;
  setPayment: (p: Partial<Payment>) => void;
  resetPayment: (error?: string) => void;
};

export const useCheckout = create<CheckoutStore>()((set) => ({
  buyer: { name: '', phone: '' },
  method: 'airtel',
  payment: { stage: 'idle' },
  setBuyer: (b) => set((s) => ({ buyer: { ...s.buyer, ...b } })),
  setMethod: (method) => set({ method }),
  setPayment: (p) => set((s) => ({ payment: { ...s.payment, ...p } })),
  resetPayment: (error) => set({ payment: { stage: error ? 'failed' : 'idle', error } }),
}));

export const METHODS: Record<PaymentMethod, { name: string; note: string; tint: string; logo?: string; code?: string; disabled?: boolean }> = {
  airtel: { name: 'Airtel Money', note: '074 · 077 · Code secret', tint: '#E52329', logo: '/images/am.png', code: '*150#' },
  moov: { name: 'Moov Money', note: '062 · 065 · Code secret', tint: '#E8622A', logo: '/images/mm.jpg', code: '*555#' },
  card: { name: 'Carte bancaire', note: 'Visa · Mastercard — bientôt', tint: 'var(--acc)', disabled: true },
};
