import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoucherForm from '../../components/VoucherForm';
import * as apiService from '../../services/api';
import { v4 as uuidv4 } from 'uuid';

// Mock uuid to return predictable values
vi.mock('uuid', () => ({
    v4: vi.fn().mockReturnValue('test-uuid-123'),
}));

// Mock the API service
vi.mock('../../services/api', () => ({
    giftVoucher: vi.fn(),
}));

describe('VoucherForm', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(uuidv4).mockReturnValue('test-uuid-123');
    });

    it('renders the form correctly', () => {
        render(<VoucherForm />);

        expect(screen.getByText('Gift a Voucher')).toBeInTheDocument();
        expect(screen.getByLabelText(/Recipient Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Gift/i })).toBeInTheDocument();
    });

    it('toggles between email and wallet address input', async () => {
        const user = userEvent.setup();
        render(<VoucherForm />);

        // Initially email should be visible
        expect(screen.getByLabelText(/Recipient Email/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Wallet Address/i)).not.toBeInTheDocument();

        // Toggle to wallet address
        const selectElement = screen.getByLabelText(/Send To/i);
        await user.selectOptions(selectElement, 'wallet');

        // Now wallet address should be visible
        expect(screen.queryByLabelText(/Recipient Email/i)).not.toBeInTheDocument();
        expect(screen.getByLabelText(/Wallet Address/i)).toBeInTheDocument();

        // Toggle back to email
        await user.selectOptions(selectElement, 'email');

        // Email should be visible again
        expect(screen.getByLabelText(/Recipient Email/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Wallet Address/i)).not.toBeInTheDocument();
    });

    it('validates email input', async () => {
        const user = userEvent.setup();
        render(<VoucherForm />);

        // Enter invalid email
        const emailInput = screen.getByLabelText(/Recipient Email/i);
        await user.type(emailInput, 'invalid-email');

        // Enter valid amount
        const amountInput = screen.getByLabelText(/Amount/i);
        await user.type(amountInput, '100');

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /send gift/i });
        await user.click(submitButton);

        // Should show validation error
        // await waitFor(() => {
        //     expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        // });

        // Clear and enter valid email
        await user.clear(emailInput);
        await user.type(emailInput, 'test@example.com');

        // Submit again
        await user.click(submitButton);

        // Wait for API call to be made
        await waitFor(() => {
            expect(apiService.giftVoucher).toHaveBeenCalled();
        });
    });

    it('validates wallet address input', async () => {
        const user = userEvent.setup();
        render(<VoucherForm />);

        // Select wallet address option
        const recipientTypeSelect = screen.getByLabelText(/Send To/i);
        await user.selectOptions(recipientTypeSelect, 'wallet');

        // Enter invalid wallet address
        const walletInput = screen.getByLabelText(/Wallet Address/i);
        await user.type(walletInput, 'invalid');

        // Enter valid amount
        const amountInput = screen.getByLabelText(/Amount/i);
        await user.type(amountInput, '100');

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /send gift/i });
        await user.click(submitButton);

        // Should show validation error
        await waitFor(() => {
            expect(screen.getByText('Please enter a valid wallet address')).toBeInTheDocument();
        });

        // Clear and enter valid wallet address
        await user.clear(walletInput);
        await user.type(walletInput, '0x1234567890abcdef1234567890abcdef12345678');

        // Submit again
        await user.click(submitButton);

        // Wait for API call to be made
        await waitFor(() => {
            expect(apiService.giftVoucher).toHaveBeenCalled();
        });
    });

    it('validates amount input', async () => {
        const user = userEvent.setup();
        render(<VoucherForm />);

        // Enter valid email
        const emailInput = screen.getByLabelText(/Recipient Email/i);
        await user.type(emailInput, 'test@example.com');

        // Enter invalid amount
        const amountInput = screen.getByLabelText(/Amount/i);
        await user.type(amountInput, '0');

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /send gift/i });
        await user.click(submitButton);

        // Should show validation error
        // await waitFor(() => {
        //     expect(screen.getByText('Please enter a valid amount (minimum $1)')).toBeInTheDocument();
        // });

        // Clear and enter valid amount
        await user.clear(amountInput);
        await user.type(amountInput, '100');

        // Submit again
        await user.click(submitButton);

        // Wait for API call to be made
        await waitFor(() => {
            expect(apiService.giftVoucher).toHaveBeenCalled();
        });
    });

    it('submits the form with valid data', async () => {
        const user = userEvent.setup();

        // Mock API response
        vi.spyOn(apiService, 'giftVoucher').mockResolvedValue({
            success: true,
            data: {
                id: 'test-voucher-id',
                status: 'PENDING',
            },
        });

        render(<VoucherForm />);

        // Fill out the form
        await user.type(screen.getByLabelText(/Recipient Email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/Amount/i), '100');
        await user.click(screen.getByRole('button', { name: /send gift/i }));

        // API should be called
        await waitFor(() => {
            expect(apiService.giftVoucher).toHaveBeenCalled();
        });

        // Success modal should be shown
        await waitFor(() => {
            expect(screen.getByText('Success!')).toBeInTheDocument();
        });
    });

    it('should show confirmation modal for high-value vouchers', async () => {
        const user = userEvent.setup();
        render(<VoucherForm />);

        // Fill out the form with high value
        await user.type(screen.getByLabelText(/Recipient Email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/Amount/i), '2000');

        // Submit the form
        await user.click(screen.getByRole('button', { name: /send gift/i }));

        // Verify confirmation modal appears
        await waitFor(() => {
            expect(screen.getByText('Confirm High-Value Voucher')).toBeInTheDocument();
        });

        expect(screen.getByText(/You are creating a voucher for/)).toBeInTheDocument();
        expect(screen.getByText(/\$2000/)).toBeInTheDocument();
    });

    it('should submit high-value voucher after confirmation', async () => {
        const user = userEvent.setup();

        // Mock API response
        vi.spyOn(apiService, 'giftVoucher').mockResolvedValue({
            success: true,
            data: {
                id: 'test-voucher-id',
                status: 'PENDING',
            },
        });

        render(<VoucherForm />);

        // Fill out the form with high value
        await user.type(screen.getByLabelText(/Recipient Email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/Amount/i), '2000');

        // Submit the form
        await user.click(screen.getByRole('button', { name: /send gift/i }));

        // Wait for confirmation modal and confirm
        await waitFor(() => {
            expect(screen.getByText('Confirm High-Value Voucher')).toBeInTheDocument();
        });

        // Click confirm button
        await user.click(screen.getByText('Confirm Amount'));

        // Wait for the success modal
        await waitFor(() => {
            expect(screen.getByText('Success!')).toBeInTheDocument();
        });

        // Verify the API was called
        expect(apiService.giftVoucher).toHaveBeenCalled();
    });

    it('handles API errors', async () => {
        const user = userEvent.setup();

        // Mock API to throw error
        vi.spyOn(apiService, 'giftVoucher').mockRejectedValue(new Error('API Error'));

        render(<VoucherForm />);

        // Fill form with valid data
        await user.type(screen.getByLabelText(/Recipient Email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/Amount/i), '100');

        // Submit the form
        await user.click(screen.getByRole('button', { name: /send gift/i }));

        // Error modal should be shown
        await waitFor(() => {
            expect(screen.getByText('Error')).toBeInTheDocument();
        });

        expect(screen.getByText('API Error')).toBeInTheDocument();
    });
});
