export interface CreatePaymentCategoryBody {
  name: string;
  action_by: string | number;
  note?: string | null;
  active_year_id:number
}

export interface FetchPaymentCategoryBody {
  id?: number;
  search?: string | null;
  page: number;
  limit: number;
}

export interface FetchPaymentCategoryParams {
  offset: number;
  filters: FetchPaymentCategoryBody;
}
export interface FetchDbPaymentCategory extends Omit<CreatePaymentCategoryBody, "action_by"> {
  id: number;
}
export type CountResult = {
  count: string;
};

export interface EditPaymentCategoryBody {
  id: number;
  name?: string;
  action_by: string | number;
  note?: string | null;
  active_year_id:number
}

export interface DeletePaymentCategoryBody {
  action_by: string | number;
  r_id: number;
  active_year_id:number
}