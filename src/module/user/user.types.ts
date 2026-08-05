

export interface CreateUserBody {
  name: string;
  address?: string | null;
  username: string;
  email: string;
  phone_number?: string | null;
  password: string;
  role: string[]; // Accepts ["ledger handle", "program handle"]
  active_year_id: number;
  action_by: number | string
}

export interface FetchUserBody {
  id?: number;
  active_year_id?: number;
  search?: string | null;
  page: number;
  limit: number;
}

export interface FetchUserParams {
  offset: number;
  filters: FetchUserBody;
}

export interface FetchDbUser extends Omit<CreateUserBody, "role" | "password"> {
  id: number;
  role: number[]; // Stored as integer array: [1, 2]
}

export type CountResult = {
  count: string;
};

export interface EditUserBody {
  id: number;
  active_year_id: number;
  name?: string;
  address?: string | null;
  username?: string;
  email?: string;
  phone_number?: string | null;
  password?: string;
  role?: string[];
  action_by: number | string
}

export interface DeleteUserBody {
  r_id: number;
  active_year_id: number;
  action_by: number | string
}

export interface LoginBody {
  username?: string;
  email?: string;
  password: string;
}
export interface MovetoCurrentActiveYear {
  user_id:number;
  action_by: number;
}