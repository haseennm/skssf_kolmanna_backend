export interface SahachariUser {
  id: number;
  name: string;
  address?: string | null;
  identification_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSahachariUserBody {
  name: string;
  address?: string | null;
  identification_name: string;
  action_by: string | number;
}

export interface FetchSahachariUserBody {
  page?: number;
  limit?: number;
  id?: number;
  search?: string | null;
}

export interface FetchSahachariUserParams {
  offset: number;
  filters: FetchSahachariUserBody;
}

export type CountResult = {
  count: string;
};

export interface EditSahachariUserBody {
  id: number;
  name?: string;
  address?: string | null;
  identification_name?: string;
  action_by: string | number;
}

export interface DeleteSahachariUserBody {
  r_id: number;
  action_by: string | number;
}