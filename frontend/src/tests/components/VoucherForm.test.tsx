import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoucherForm from '../../components/VoucherForm';
import * as apiService from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  giftVoucher: vi.fn(),
}));

describe('VoucherForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the form correctly', () => {
    // Arrange & Act
    render(<VoucherForm />);
    
    // Assert
    expect(screen.getByText('Gift a Voucher')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gift Voucher/i })).toBeInTheDocument();
  });

  it('toggles between email and wallet address input', async () => {
    // Arrange
    render(<VoucherForm />);
    
    // Act - Initially email should be visible
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Wallet Address/i)).not.toBeInTheDocument();
    
    // Toggle to wallet address
    const toggle = screen.getByText(/Use Wallet Address/i);
    await userEvent.click(toggle);
    
    // Assert - Now wallet address should be visible
    expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Wallet Address/i)).toBeInTheDocument();
    
    // Toggle back to email
    const toggleBack = screen.getByText(/Use Email/i);
    await userEvent.click(toggleBack);
    
    // Assert - Email should be visible again
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Wallet Address/i)).not.toBeInTheDocument();
  });

  it('validates email input', async () => {
    // Arrange
    render(<VoucherForm />);
    
    // Act - Enter invalid email
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.blur(emailInput);
    
    // Assert - Should show validation error
    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    
    // Act - Enter valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'valid@example.com');
    fireEvent.blur(emailInput);
    
    // Assert - Should not show validation error
    expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
  });

  it('validates wallet address input', async () => {
    // Arrange
    render(<VoucherForm />);
    
    // Toggle to wallet address
    const toggle = screen.getByText(/Use Wallet Address/i);
    await userEvent.click(toggle);
    
    // Act - Enter invalid wallet address
    const walletInput = screen.getByLabelText(/Wallet Address/i);
    await userEvent.type(walletInput, 'invalid-wallet');
    fireEvent.blur(walletInput);
    
    // Assert - Should show validation error
    expect(screen.getByText(/Please enter a valid Ethereum wallet address/i)).toBeInTheDocument();
    
    // Act - Enter valid wallet address
    await userEvent.clear(walletInput);
    await userEvent.type(walletInput, '0x1234567890abcdef1234567890abcdef12345678');
    fireEvent.blur(walletInput);
    
    // Assert - Should not show validation error
    expect(screen.queryByText(/Please enter a valid Ethereum wallet address/i)).not.toBeInTheDocument();
  });

  it('validates amount input', async () => {
    // Arrange
    render(<VoucherForm />);
    
    // Act - Enter invalid amount (too small)
    const amountInput = screen.getByLabelText(/Amount/i);
    await userEvent.type(amountInput, '0');
    fireEvent.blur(amountInput);
    
    // Assert - Should show validation error
    expect(screen.getByText(/Amount must be at least 1/i)).toBeInTheDocument();
    
    // Act - Enter valid amount
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '100');
    fireEvent.blur(amountInput);
    
    // Assert - Should not show validation error
    expect(screen.queryByText(/Amount must be at least 1/i)).not.toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    // Arrange
    const mockGiftVoucher = vi.fn().mockResolvedValue({
      id: 'test-id',
      status: 'PENDING',
    });
    (apiService.giftVoucher as any).mockImplementation(mockGiftVoucher);
    
    render(<VoucherForm />);
    
    // Act - Fill form with valid data
    await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Amount/i), '100');
    await userEvent.type(screen.getByLabelText(/Message/i), 'Test message');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /Gift Voucher/i }));
    
    // Assert - API should be called with correct data
    await waitFor(() => {
      expect(apiService.giftVoucher).toHaveBeenCalledWith({
        recipientEmail: 'test@example.com',
        amount: 100,
        message: 'Test message',
      });
    });
    
    // Assert - Success modal should be shown
    await waitFor(() => {
      expect(screen.getByText(/Voucher Gift Sent Successfully/i)).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    // Arrange
    const errorMessage = 'API Error';
    const mockGiftVoucher = vi.fn().mockRejectedValue(new Error(errorMessage));
    (apiService.giftVoucher as any).mockImplementation(mockGiftVoucher);
    
    render(<VoucherForm />);
    
    // Act - Fill form with valid data
    await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Amount/i), '100');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /Gift Voucher/i }));
    
    // Assert - Error modal should be shown
    await waitFor(() => {
      expect(screen.getByText(/Error Sending Voucher Gift/i)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });
  });
});
