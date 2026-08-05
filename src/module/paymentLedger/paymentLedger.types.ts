export interface PaymentOverviewItem {
  amount: number;
  payment_category_id: number;
  note: string;
}

export interface CreatePaymentLedgerBody {
  program_id?: number | null;
  total_amount: number;
  paid_amount: number;
  note?: string | null;
  date: string; // "YYYY-MM-DD" or "MM/DD/YYYY"
  payment_overview: PaymentOverviewItem[];
  payment_flow: "In" | "Out";
  discount: number; // e.g. "Draft", "Approved", "Paid"
  active_year_id: number;
  action_by: number | string;
}

export interface FetchPaymentLedgerBody {
  id?: number;
  program_id?: number | null;
  active_year_id?: number;
  payment_flow?: "In" | "Out";
  search?: string | null;
  end_date?: string | null;
  start_date?: string | null;
  page: number;
  limit: number;
}

export interface FetchPaymentLedgerParams {
  offset: number;
  filters: FetchPaymentLedgerBody;
}

export interface FetchDbPaymentLedger extends Omit<CreatePaymentLedgerBody, "action_by"> {
  id: number;
  reference_number: string;
  program_name?: string;
  program_wing?: string;
}

export type CountResult = {
  count: string;
};

export interface EditPaymentLedgerBody {
  id: number;
  active_year_id: number;
  action_by: number | string;
  program_id?: number | null;
  total_amount?: number;
  paid_amount?: number;
  note?: string | null;
  date?: string;
  payment_overview?: PaymentOverviewItem[];
  payment_flow?: "In" | "Out";
  discount?: number;
}
export interface DeletePaymentLedgerBody {
  r_id: number;
  active_year_id: number;
  action_by: number | string;
}