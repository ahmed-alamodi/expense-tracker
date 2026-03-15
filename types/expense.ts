export interface Expense {
  id: string;
  date: string;
  main_category: string;
  sub_category: string;
  description: string;
  amount_sar: number;
  amount_ymr: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
  user_id?: string;
}

export interface Budget {
  id: string;
  month: number;
  year: number;
  category: string;
  amount: number;
  user_id?: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  user_id?: string;
}

export interface CategoryGroup {
  main: string;
  subs: string[];
}

export interface MonthYear {
  month: number;
  year: number;
}

export type PaymentMethod = string;
