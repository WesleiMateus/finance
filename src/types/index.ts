export type Role = 'admin' | 'user';
export type AccountStatus = 'active' | 'pending' | 'blocked';
export type TransactionType = 'income' | 'expense' | 'installment' | 'recurring';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  subscriptionExpiresAt: Date;
  createdAt: Date;
  onboardingCompleted?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: Date;
  description: string;
  createdAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  color: string;
}
