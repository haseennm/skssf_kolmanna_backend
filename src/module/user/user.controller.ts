import { transaction } from "../../config/db";
import { validateActiveYearAndRole, validateUserRole } from "../../middleware/authCheck";
import { AppError } from "../../utils/AppError";
import UserService from "./user.service";
import {
  CreateUserBody,
  DeleteUserBody,
  EditUserBody,
  FetchUserParams,
  LoginBody,
  MovetoCurrentActiveYear
} from "./user.types";

export default class UserController {
  service = new UserService();
  async createUser(data: CreateUserBody) {
    return transaction(async (client) => {
      if (data.role.includes("all handle")) {
        await validateActiveYearAndRole({
          action_by: data.action_by,
          active_year_id: data.active_year_id,
          role: ["all handle"],
          client: client,
          inputDate: undefined
        })
      } else {

        await validateActiveYearAndRole({
          action_by: data.action_by,
          active_year_id: data.active_year_id,
          role: ["all handle", "user handle"],
          client: client,
          inputDate: undefined
        })
      }
      const user = await this.service.createUser(data, client);
      return user;
    });
  }

  async fetchUser(data: FetchUserParams) {
    return transaction(async (client) => {
      await validateUserRole({
        action_by: data.filters.action_by,
        role: ["all handle"],
        client: client
      })
      const users = await this.service.fetchUser(data);
      return users;
    })
  }

  async editUser(data: EditUserBody) {
    return transaction(async (client) => {
      if (data.role?.includes("all handle")) {
        await validateActiveYearAndRole({
          action_by: data.action_by,
          active_year_id: data.active_year_id,
          role: ["all handle"],
          client: client,
          inputDate: undefined
        })
      } else {

        await validateActiveYearAndRole({
          action_by: data.action_by,
          active_year_id: data.active_year_id,
          role: ["all handle", "user handle"],
          client: client,
          inputDate: undefined
        })
      }
      const result = await this.service.updateUser(data, client);
      return result;
    });
  }

  async deleteUser(data: DeleteUserBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "user handle"],
        client: client,
        inputDate: undefined
      })
      const user = await this.service.deleteUser(data, client);
      return user;
    });
  }

  async login(data: LoginBody) {
    if (!data.email && !data.username) {
      throw new AppError(
        "Either email or username must be provided.",
        400
      );
    }
    const result = await this.service.login(data);
    return result;
  }
  async movetoCurrentYear(data: MovetoCurrentActiveYear) {
    return transaction(async (client) => {

      const result = await this.service.movetoCurrentYear(data, client);
      validateUserRole({
        action_by: data.action_by,
        role: ["all handle", "user handle"],
        client: client
      })
      return result;
    })
  }
}