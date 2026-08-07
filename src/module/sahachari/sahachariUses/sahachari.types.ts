export type SahachariStatus = "Issued" | "Returned";
export type SahachariFilter = "all" | "issued" | "returned" | "overdue_3_months";

export interface CreateSahachariBody {
  user_id: number;
  item_id: number;
  issue_date: string;
  action_by: string | number;
}

export interface ReturnSahachariBody {
  id: number;
  return_date: string; // YYYY-MM-DD
  action_by: string | number;
}

export interface FetchSahachariBody {
  id?: number;
  user_id?: number;
  item_id?: number;
  search?: string | null;
  filter?: SahachariFilter;
  page: number;
  limit: number;
  start_date?: string;
  end_date?: string;
}

export interface FetchSahachariParams {
  offset: number;
  filters: FetchSahachariBody;
}

export interface FetchDbSahachari {
  id: number;
  user_id: number;
  item_id: number;
  issue_date: string;
  issued_by: string | number;
  return_date: string | null;
  return_by: string | number | null;
  status: number;
  user_name: string;
  item_name: string;
  issued_by_name?: string;
  return_by_name?: string;
}

export type CountResult = {
  count: string;
};