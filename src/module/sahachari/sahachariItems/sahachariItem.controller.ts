
import { transaction } from "../../../config/db";
import { validateUserRole } from "../../../middleware/authCheck";
import { getStatusText } from "../../../utils/extra";
import SahachariItemService from "./sahachariItem.service";
import {
    CreateItemBody,
    DeleteItemBody,
    EditItemBody,
    FetchItemBody
} from "./sahachariItems.types";

export default class SahachariItemController {
    service = new SahachariItemService();

    async createItem(data: CreateItemBody) {
        return transaction(async (client) => {
            await validateUserRole({
                action_by: data.action_by,
                role: ["all handle", "sahachari handle"],
                client: client
            });
            const items = await this.service.createItem(data, client);
            return items;
        });
    }

   async fetchItem(data: { offset: number; filters: FetchItemBody }) {
  const items = await this.service.fetchItem(data);

  return {
    ...items,
    items: items.items.map(item => ({
      ...item,
      status: getStatusText(item.status),
    })),
  };
}
    async editItem(data: EditItemBody) {
        return transaction(async (client) => {
            await validateUserRole({
                action_by: data.action_by,
                role: ["all handle", "sahachari handle"],
                client: client
            });
            const result = await this.service.updateItem(data, client);
            return result;
        });
    }

    async deleteItem(data: DeleteItemBody) {
        return transaction(async (client) => {
            await validateUserRole({
                action_by: data.action_by,
                role: ["all handle", "sahachari handle"],
                client: client
            });
            const deletedItem = await this.service.deleteItem(data, client);
            return deletedItem;
        });
    }
}