export interface CreateStockBody {
  item_id: number;
  quantity: number;
  note?: string | null;
  active_year_id: number;
  action_by: number | string;
}

export interface FetchStockBody {
  id?: number;
  item_id?: number;
  search?: string | null;
  page: number;
  limit: number;
}

export interface FetchStockParams {
  offset: number;
  filters: FetchStockBody;
}

export interface FetchDbStock {
  id: number;
  item_id: number;
  item_name?: string;
  quantity: number;
  note: string | null;
}

export type CountResult = {
  count: string;
};

export interface EditStockBody {
  id: number;
  item_id?: number;
  quantity?: number;
  note?: string | null;
  active_year_id: number;
  action_by: number | string;
}

export interface DeleteStockBody {
  r_id: number;
  active_year_id: number;
  action_by: number | string;
}