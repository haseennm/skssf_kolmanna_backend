import { transaction } from "../../config/db";
import { validateActiveYearAndRole } from "../../middleware/authCheck";
import StockService from "./stock.service";
import {
  CreateStockBody,
  DeleteStockBody,
  EditStockBody
} from "./stock.types";

export default class StockController {
  service = new StockService();

  async createStock(data: CreateStockBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "stock handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const stock = await this.service.createStock(data, client);
      return stock;
    });
  }

  async fetchStock(data: any) {
    const stocks = await this.service.fetchStock(data);
    return stocks;
  }

  async editStock(data: EditStockBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "stock handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const result = await this.service.updateStock(data, client);
      return result;
    });
  }

  async deleteStock(data: DeleteStockBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "stock handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const stock = await this.service.deleteStock(data, client);
      return stock;
    });
  }
}