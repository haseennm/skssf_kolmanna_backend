import { transaction } from "../../config/db";
import { validateActiveYearAndRole } from "../../middleware/authCheck";
import PaymentCategoryService from "./payment_category.service";
import {
  CreatePaymentCategoryBody,
  DeletePaymentCategoryBody,
  EditPaymentCategoryBody
} from "./payment_category.types";

export default class PaymentCategoryController {
  service = new PaymentCategoryService();

  async createPaymentCategory(data: CreatePaymentCategoryBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "ledger handle"],
        client: client,
        inputDate: undefined
      })
      const category = await this.service.createPaymentCategory(data, client);
      return category;
    });
  }

  async fetchPaymentCategory(data: any) {
    const categories = await this.service.fetchPaymentCategory(data);
    return categories;
  }

  async editPaymentCategory(data: EditPaymentCategoryBody) {

    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "ledger handle"],
        client: client,
        inputDate: undefined
      })
      const result = await this.service.updatePaymentCategory(data, client);
      return result;
    });
  }

  async deletePaymentCategory(data: DeletePaymentCategoryBody) {

    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "ledger handle"],
        client: client,
        inputDate: undefined
      })
      const result = await this.service.deletePaymentCategory(data, client);
      return result;
    });
  }
}