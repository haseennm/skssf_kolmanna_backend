export interface SahachariItem {
  id: number;
  name: string;
  description?: string | null;
  item_code: string;
  status: number;
  amount: null | number;
}

export interface CreateItemBody {
  name: string;
  description?: string;
  item_code: [string, string];
  amount?: number;
  action_by: string | number;
}

export interface FetchItemBody {
  page?: number;
  limit?: number;
  id?: number;
  search?: string | null;
  status?: number;
}

export interface FetchItemParams {
  offset: number;
  filters: FetchItemBody;
}

export interface EditItemBody {
  id: number;
  name?: string;
  description?: string;
  item_code?: string;
  amount?: number;
  status?: number;
  action_by: string | number;
}

export interface DeleteItemBody {
  r_id: number;
  action_by: string | number;
}

export type CountResult = {
  count: string;
};