import { PoolClient } from 'pg';
import { OtpServices } from './otp.service';
import { transaction } from '../../config/db';

export class OTPController {
  private readonly otpService: OtpServices;

  constructor() {
    this.otpService = new OtpServices();
  }

  async createOTP(user_id: string | number, client: PoolClient) {
    return await this.otpService.createOTPService(user_id, client);
  }

  async verifyOTP(user_id: string | number, otp: string,client:PoolClient) {
      return await this.otpService.verifyOTPService(user_id, otp, client);
    
  }

  async deleteOTP(user_id: string | number) {
    return transaction(async (client) => {
      return await this.otpService.deleteOTPService(user_id, client);
    })
  }
}