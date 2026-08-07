import { transaction } from "../../../config/db";
import { validateUserRole } from "../../../middleware/authCheck";
import SahachariUserService from "./sahachariUser.service";
import {
    CreateSahachariUserBody,
    DeleteSahachariUserBody,
    EditSahachariUserBody
} from "./sahachariUser.types";

export default class SahachariUserController {
    service = new SahachariUserService();

    async createUser(data: CreateSahachariUserBody) {
        return transaction(async (client) => {
            await validateUserRole({
                action_by: data.action_by,
                role: ["all handle", "sahachari handle"],
                client: client
            });
            const user = await this.service.createUser(data, client);
            return user;
        });
    }

    async fetchUser(data: any) {
        const users_with_pagination = await this.service.fetchUser(data);
        return users_with_pagination;
    }

    async editUser(data: EditSahachariUserBody) {
        return transaction(async (client) => {
            await validateUserRole({
                action_by: data.action_by,
                role: ["all handle", "sahachari handle"],
                client: client
            });
            const result = await this.service.updateUser(data, client);
            return result;
        });
    }

    async deleteUser(data: DeleteSahachariUserBody) {
        return transaction(async (client) => {
            await validateUserRole({
                action_by: data.action_by,
                role: ["all handle", "sahachari handle"],
                client: client
            });
            const user = await this.service.deleteUser(data, client);
            return user;
        });
    }
}