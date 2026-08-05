export interface CreateProgramBody {
  title: string;
  wing: string;
  date: string; // ISO date string or formatted date
  active_year_id: number;
  action_by: string | number;
}

export interface FetchProgramBody {
  id?: number;
  active_year_id?: number;
  search?: string | null;
  page: number;
  limit: number;
  start_date:string;
  end_date:string;
}

export interface FetchProgramParams {
  offset: number;
  filters: FetchProgramBody;
}

export interface FetchDbProgram extends Omit<CreateProgramBody, "action_by"> {
  id: number;
}

export type CountResult = {
  count: string;
};

export interface EditProgramBody {
  id: number;
  active_year_id: number;
  action_by: string | number;
  title?: string;
  wing?: string;
  date?: string;
}

export interface DeleteProgramBody {
  r_id: number;
  active_year_id: number;
  action_by: string | number;
}