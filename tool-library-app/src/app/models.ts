export interface Tool {
  id: number;
  name: string;
  description: string;
  weight: number;
  status: string;
  ownerId: number;
}

export interface Resident {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface Loan {
  id: number;
  toolId: number;
  borrowerId: number;
  loanDate: string;
  returnDate: string | null;
}

export type View = 'overview' | 'tools' | 'residents' | 'loans';
export type Modal = 'tool' | 'resident' | 'loan' | null;

export interface DeleteConfirmation {
  message: string;
  onConfirm: () => void;
}
