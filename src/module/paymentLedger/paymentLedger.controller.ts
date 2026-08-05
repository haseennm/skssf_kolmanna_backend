import { transaction } from "../../config/db";
import { validateActiveYearAndRole } from "../../middleware/authCheck";
import PaymentLedgerService from "./paymentLedger.service";
import {
  CreatePaymentLedgerBody,
  DeletePaymentLedgerBody,
  EditPaymentLedgerBody
} from "./paymentLedger.types";

export default class PaymentLedgerController {
  service = new PaymentLedgerService();

  async createLedger(data: CreatePaymentLedgerBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "ledger handle"],
        client: client,
        inputDate: data.date
      })
      const ledger = await this.service.createLedger(data, client);
      return ledger;
    });
  }

  async fetchLedger(data: any) {
    const records = await this.service.fetchLedger(data);
    return records;
  }

  async editLedger(data: EditPaymentLedgerBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "ledger handle"],
        client: client,
        inputDate: data.date || undefined
      })
      const result = await this.service.updateLedger(data, client);
      return result;
    });
  }

  async deleteLedger(data: DeletePaymentLedgerBody) {
    return transaction(async (client) => {
      await validateActiveYearAndRole({
        action_by: data.action_by,
        active_year_id: data.active_year_id,
        role: ["all handle", "ledger handle"],
        client: client,
        inputDate: new Date().toISOString().split("T")[0]
      })
      const ledger = await this.service.deleteLedger(data, client);
      return ledger;
    });
  }
}