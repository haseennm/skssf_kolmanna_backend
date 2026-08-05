export interface CreateLostStockBody {
  stock_id: number;
  quantity: number;
  reason?: string | null;
  active_year_id: number;
  action_by: number | string;
}

export interface FetchLostStockBody {
  id?: number;
  stock_id?: number;
  active_year_id?: number;
  search?: string | null;
  page: number;
  limit: number;
}

export interface FetchLostStockParams {
  offset: number;
  filters: FetchLostStockBody;
}

export interface FetchDbLostStock {
  id: number;
  stock_id: number;
  quantity: number;
  reason: string | null;
  active_year_id: number;
  item_id?: number;
  item_name?: string;
  created_at?: string;
  updated_at?: string;
}

export type CountResult = {
  count: string;
};

export interface EditLostStockBody {
  id: number;
  active_year_id: number;
  action_by: number | string;
  stock_id?: number;
  quantity?: number;
  reason?: string | null;
}

export interface DeleteLostStockBody {
  r_id: number;
  active_year_id: number;
  action_by: number | string;
}