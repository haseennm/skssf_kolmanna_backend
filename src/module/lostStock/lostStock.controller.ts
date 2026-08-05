import { transaction } from "../../config/db";
import { validateActiveYearAndRole } from "../../middleware/authCheck";
import LostStockService from "./lostStock.service";
import {
  CreateLostStockBody,
  DeleteLostStockBody,
  EditLostStockBody
} from "./lostStock.types";

export default class LostStockController {
  service = new LostStockService();

  async createLostStock(data: CreateLostStockBody) {
    return transaction(async (client) => {

      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "stock handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const lostStock = await this.service.createLostStock(data, client);
      return lostStock;
    });
  }

  async fetchLostStock(data: any) {
    const lostStocks = await this.service.fetchLostStock(data);
    return lostStocks;
  }

  async editLostStock(data: EditLostStockBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "stock handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const result = await this.service.updateLostStock(data, client);
      return result;
    });
  }

  async deleteLostStock(data: DeleteLostStockBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "stock handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const result = await this.service.deleteLostStock(data, client);
      return result;
    });
  }
}