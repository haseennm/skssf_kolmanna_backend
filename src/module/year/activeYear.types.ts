export interface CreateActiveYearBody {
  year_title: string;
  status: string; // "Open" | "End"
  created_by: string;
}


export interface FetchActiveYearBody {
  id?: number;
  company_id: number;
  search?: string | null;
  status?: number;
  page: number;
  limit: number;
}

export interface FetchActiveYearParams {
  offset: number;
  filters: FetchActiveYearBody;
}

export interface FetchDbActiveYear
  extends Omit<CreateActiveYearBody, "status" | "created_by"> {
  id: string;
  status: number;
}

export type CountResult = {
  count: string;
};

export interface EditActiveYearBody {
  id: number;
  updated_by: string;
  year_title?: string;
  start_date?: string;
  end_date?: string;
}

export interface DeleteActiveYearBody {
  r_id: number;
  action_by: string;
}
export interface ChangeStatusYear {
  id: number;
  action_by:string
}