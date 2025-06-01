import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8080/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface VoucherResponse {
  id: string;
  status: string;
}

export interface VoucherGiftRequest {
  recipientEmail?: string;
  walletAddress?: string;
  amount: number;
  message?: string;
}

export const giftVoucher = async (data: VoucherGiftRequest): Promise<ApiResponse<VoucherResponse>> => {
  try {
    const response = await axios.post<ApiResponse<VoucherResponse>>(`${API_BASE_URL}/vouchers/gift`, data);
    // console.log(API_BASE_URL);
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(
        typeof error.response.data.error === 'string'
          ? error.response.data.error
          : 'Validation error. Please check your input.'
      );
    }
    throw new Error('Network error. Please try again.');
  }
};

export const simulateProcessVoucher = async (data: VoucherGiftRequest): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await axios.post<ApiResponse<{ message: string }>>(`${API_BASE_URL}/simulate/process-voucher`, data);
    return response.data;
  } catch (error) {
    console.error('Error simulating voucher processing:', error);
    throw new Error('Failed to simulate voucher processing');
  }
};
