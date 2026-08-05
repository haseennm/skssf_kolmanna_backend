import { transaction } from "../../config/db";
import { validateActiveYearAndRole } from "../../middleware/authCheck";
import ProgramService from "./programs.service";
import {
    CreateProgramBody,
    DeleteProgramBody,
    EditProgramBody
} from "./programs.types";

export default class ProgramController {
    service = new ProgramService();

    async createProgram(data: CreateProgramBody) {
        return transaction(async (client) => {
            await validateActiveYearAndRole({
                action_by: data.action_by,
                active_year_id: data.active_year_id,
                role: ["all handle", "program handle"],
                client: client,
                inputDate: data.date
            })
            const program = await this.service.createProgram(data, client);
            return program;
        });
    }

    async fetchProgram(data: any) {
        const programs_with_pagination = await this.service.fetchProgram(data);
        return programs_with_pagination;
    }

    async editProgram(data: EditProgramBody) {
        return transaction(async (client) => {
            await validateActiveYearAndRole({
                action_by: data.action_by,
                active_year_id: data.active_year_id,
                role: ["all handle", "program handle"],
                client: client,
                inputDate: data.date || undefined
            })
            const result = await this.service.updateProgram(data, client);
            return result;
        });
    }

    async deleteProgram(data: DeleteProgramBody) {
       
        return transaction(async (client) => {
            await validateActiveYearAndRole({
                action_by: data.action_by,
                active_year_id: data.active_year_id,
                role: ["all handle", "program handle"],
                client:client,
                inputDate:new Date().toISOString().split("T")[0]
            })
            const program = await this.service.deleteProgram(
                data, client);
            return program;
        });
    }
}