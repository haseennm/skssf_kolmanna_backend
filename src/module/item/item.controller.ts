import { transaction } from "../../config/db";
import { validateActiveYearAndRole } from "../../middleware/authCheck";
import ItemService from "./item.service";
import {
  CreateItemBody,
  DeleteItemBody,
  EditItemBody
} from "./item.types";

export default class ItemController {
  service = new ItemService();

  async createItem(data: CreateItemBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "stock handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const item = await this.service.createItem(data, client);
      return item;
    });
  }

  async fetchItem(data: any) {
    const items = await this.service.fetchItem(data);
    return items;
  }

  async editItem(data: EditItemBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "stock handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const result = await this.service.updateItem(data, client);
      return result;
    });
  }

  async deleteItem(data: DeleteItemBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "stock handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const item = await this.service.deleteItem(data, client);
      return item;
    });
  }
}