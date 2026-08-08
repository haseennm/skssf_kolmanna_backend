import { PoolClient } from 'pg';
import { OTPRecord, OTPVerificationResult } from './otp.types';
import { executeInTransaction } from '../../config/db';
import { AppError } from '../../utils/AppError';

// Generate 6-digit random code
const generate6DigitOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
export class OtpServices {

  async createOTPService(userId: string | number, client: PoolClient): Promise<string> {
    const otp = generate6DigitOTP();

    // Upsert OTP with 10-minute expiry
    const query = `
     INSERT INTO otps (user_id, otp, created_at, expires_at)
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '10 minutes')
     ON CONFLICT (user_id) 
     DO UPDATE SET 
       otp = EXCLUDED.otp,
       created_at = NOW(),
       expires_at = NOW() + INTERVAL '10 minutes';
   `;
    await executeInTransaction(client, query, [userId, otp]);
    return otp;
  };
  async verifyOTPService(
    userId: string | number,
    otp: string,
    client: PoolClient
  ): Promise<boolean> {
    const selectQuery = `
    SELECT otp, expires_at
    FROM otps
    WHERE user_id = $1 AND otp = $2;
  `;
console.log(userId,otp)
    const result = await executeInTransaction(
      client,
      selectQuery,
      [userId, otp]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        "Invalid OTP.",
        400
      );
    }

    const otpRecord = result.rows[0];

    if (new Date(otpRecord.expires_at) <= new Date()) {
      await this.deleteOTPService(userId, client);

      throw new AppError(
        "OTP has expired. Please request a new OTP.",
        400
      );
    }

    await this.deleteOTPService(userId, client);

    return true;
  }
  async deleteOTPService(
    userId: string | number,
    client: PoolClient
  ): Promise<void> {
    const deleteQuery = `
      DELETE FROM otps
      WHERE user_id = $1;
    `;

    await executeInTransaction(client, deleteQuery, [userId]);
  }

  async cleanupExpiredOTPsService(
    client: PoolClient
  ): Promise<number> {
    const query = `
      DELETE FROM otps
      WHERE expires_at <= NOW();
    `;

    const result = await executeInTransaction(client, query);

    return result.rowCount || 0;
  }
}
