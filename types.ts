
export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  profit: number;
  date: string;
  paymentMethod: 'cash' | 'debt' | 'transfer';
  customerName?: string;
}

export interface Debt {
  id: string;
  customerName: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
  description: string;
}

export type View = 'dashboard' | 'sales' | 'inventory' | 'debts' | 'ai';
