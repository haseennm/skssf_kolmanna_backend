export interface OTPRecord {
    user_id: string | number;
    otp: string;
    created_at: Date;
    expires_at: Date;
}

export interface GenerateOTPPayload {
    user_id: string | number;
}



export interface DeleteOTPPayload {
    user_id: string | number;
}
export type OTPVerificationResult = {
  success: boolean;
  message: string;
};