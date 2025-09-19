
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AutomateFinancialForecastingOutput } from '@/ai/flows/automate-financial-forecasting';

export interface FinancialInputs {
  // Large Customers
  largeCustomers?: number;
  revPerLargeCustomer?: number;
  salesExecutives?: number;
  salesExecutivesAddedPerMonth?: number;
  salesConversionPerExec?: number;
  avgSalesCycleMonths?: number;
  rampUpPeriodMonths?: number;
  largeCustomerChurn?: number;
  largeCustomerGrossMargin?: number;

  // Small-Medium Customers
  smallMediumCustomers?: number;
  revPerSmallMediumCustomer?: number;
  marketingSpend?: number;
  cac?: number;
  conversionRate?: number;
  smCustomerChurn?: number;
  smCustomerGrossMargin?: number;

  // Company-wide
  operatingExpenses?: number; // Current monthly operating expenses
  
  // Cash Flow & Profitability
  cashInBank?: number;
  operatingExpenseGrowthRate?: number; // % per month
  grossMarginRate?: number; // Gross margin percentage (e.g., 0.70 for 70%)
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string; // Main text content
  isThinking?: boolean;
  forecastData?: AutomateFinancialForecastingOutput | null;
}


interface FinancialState {
  inputs: FinancialInputs | null;
  hasBeenSaved: boolean;
  messages: ChatMessage[];
  setInputs: (inputs: FinancialInputs) => void;
  clearInputs: () => void;
  setHasBeenSaved: (hasBeenSaved: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
}

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      inputs: null,
      hasBeenSaved: false,
      messages: [],
      setInputs: (inputs) => set({ inputs }),
      clearInputs: () => set({ inputs: null, hasBeenSaved: false }),
      setHasBeenSaved: (hasBeenSaved) => set({ hasBeenSaved }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
      updateMessage: (id, updates) => set(state => ({
        messages: state.messages.map(msg => msg.id === id ? { ...msg, ...updates } : msg)
      })),
      removeMessage: (id: string) => set(state => ({
        messages: state.messages.filter(msg => msg.id !== id)
      })),
    }),
    {
      name: 'financial-input-storage', 
      storage: createJSONStorage(() => sessionStorage), 
    }
  )
);
