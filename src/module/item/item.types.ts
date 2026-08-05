export interface CreateItemBody {
  name: string;
  note?: string | null;
  active_year_id: number;
  action_by: number | string;
}

export interface FetchItemBody {
  id?: number;
  active_year_id?: number;
  search?: string | null;
  page: number;
  limit: number;
}

export interface FetchItemParams {
  offset: number;
  filters: FetchItemBody;
}

export interface FetchDbItem {
  id: number;
  name: string;
  note: string | null;
  active_year_id: number;
}

export type CountResult = {
  count: string;
};

export interface EditItemBody {
  id: number;
  active_year_id: number;
  name?: string;
  note?: string | null;
  action_by: number | string;
}

export interface DeleteItemBody {
  r_id: number;
  active_year_id: number;
  action_by: number | string;
}