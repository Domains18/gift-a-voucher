'use client';

import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { giftVoucher, type VoucherGiftRequest } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import './VoucherForm.css';

interface FormData {
    recipientType: 'email' | 'wallet';
    recipientEmail?: string;
    walletAddress?: string;
    amount: number;
    message?: string;
}

// Constants for amount limits
const HIGH_VALUE_THRESHOLD = 1000; // $1,000

const VoucherForm: React.FC = () => {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showHighValueConfirmModal, setShowHighValueConfirmModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [voucherId, setVoucherId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingSubmission, setPendingSubmission] = useState<VoucherGiftRequest | null>(null);

    // Add manual validation state for tests
    const [validationErrors, setValidationErrors] = useState<{
        email?: string;
        wallet?: string;
        amount?: string;
    }>({});

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            recipientType: 'email',
            recipientEmail: '',
            walletAddress: '',
            amount: 0,
            message: '',
        },
        mode: 'onSubmit', // Validate on submit
    });

    const recipientType = watch('recipientType');
    const amount = watch('amount');
    const isHighValue = amount >= HIGH_VALUE_THRESHOLD;

    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validateWalletAddress = (address: string): boolean => {
        return address.trim().length >= 10;
    };

    const preparePayload = (data: FormData, confirmHighValue = false): VoucherGiftRequest => {
        const payload: VoucherGiftRequest = {
            amount: data.amount,
            idempotencyKey: uuidv4(),
        };

        if (data.recipientType === 'email' && data.recipientEmail) {
            payload.recipientEmail = data.recipientEmail;
        } else if (data.recipientType === 'wallet' && data.walletAddress) {
            payload.walletAddress = data.walletAddress;
        }

        if (data.message?.trim()) {
            payload.message = data.message;
        }

        if (isHighValue) {
            payload.confirmHighValue = confirmHighValue;
        }

        return payload;
    };

    const onSubmit = async (data: FormData) => {
        // Clear previous validation errors
        setValidationErrors({});

        let hasErrors = false;

        // Validate recipient
        if (data.recipientType === 'email') {
            if (!data.recipientEmail || !validateEmail(data.recipientEmail)) {
                setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                hasErrors = true;
            }
        } else {
            if (!data.walletAddress || !validateWalletAddress(data.walletAddress)) {
                setValidationErrors(prev => ({ ...prev, wallet: 'Please enter a valid wallet address' }));
                hasErrors = true;
            }
        }

        // Validate amount
        if (!data.amount || data.amount < 1) {
            setValidationErrors(prev => ({ ...prev, amount: 'Please enter a valid amount (minimum $1)' }));
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        // Check if this is a high-value voucher that requires confirmation
        if (isHighValue) {
            setPendingSubmission(preparePayload(data, false));
            setShowHighValueConfirmModal(true);
            return;
        }

        await submitVoucher(data);
    };

    const handleHighValueConfirm = async () => {
        setShowHighValueConfirmModal(false);
        if (pendingSubmission) {
            const confirmedPayload = { ...pendingSubmission, confirmHighValue: true };
            await submitVoucherWithPayload(confirmedPayload);
        }
    };

    const submitVoucher = async (data: FormData) => {
        const payload = preparePayload(data, true);
        await submitVoucherWithPayload(payload);
    };

    const submitVoucherWithPayload = async (payload: VoucherGiftRequest) => {
        setIsSubmitting(true);

        try {
            const response = await giftVoucher(payload);
            setVoucherId(response.data.id);
            setShowSuccessModal(true);
            reset();
        } catch (error: any) {
            setErrorMessage(error.message || 'Failed to process your request');
            setShowErrorModal(true);
        } finally {
            setIsSubmitting(false);
            setPendingSubmission(null);
        }
    };

    const closeModal = (modalSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
        modalSetter(false);
    };

    return (
        <div className="voucher-form-container">
            <div className="voucher-form-card">
                <div className="voucher-form-header">
                    <h2>Gift a Voucher</h2>
                </div>
                <div className="voucher-form-body">
                    <form onSubmit={handleSubmit(onSubmit)} className="voucher-form">
                        <div className="form-group">
                            <label htmlFor="recipientType" className="form-label">
                                Send To
                            </label>
                            <select id="recipientType" {...register('recipientType')} className="form-control">
                                <option value="email">Email Address</option>
                                <option value="wallet">Wallet Address</option>
                            </select>
                        </div>

                        {recipientType === 'email' && (
                            <div className="form-group">
                                <label htmlFor="recipientEmail" className="form-label">
                                    Recipient Email
                                </label>
                                <input
                                    id="recipientEmail"
                                    type="email"
                                    {...register('recipientEmail')}
                                    className={`form-control ${validationErrors.email ? 'error' : ''}`}
                                    placeholder="recipient@example.com"
                                />
                                {validationErrors.email && (
                                    <div className="error-message" role="alert">
                                        {validationErrors.email}
                                    </div>
                                )}
                            </div>
                        )}

                        {recipientType === 'wallet' && (
                            <div className="form-group">
                                <label htmlFor="walletAddress" className="form-label">
                                    Wallet Address
                                </label>
                                <input
                                    id="walletAddress"
                                    type="text"
                                    {...register('walletAddress')}
                                    className={`form-control ${validationErrors.wallet ? 'error' : ''}`}
                                    placeholder="0x..."
                                />
                                {validationErrors.wallet && (
                                    <div className="error-message" role="alert">
                                        {validationErrors.wallet}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="amount" className="form-label">
                                Amount
                            </label>
                            <div className="input-group">
                                <span className="input-prefix">$</span>
                                <input
                                    id="amount"
                                    type="number"
                                    {...register('amount', { valueAsNumber: true })}
                                    className={`form-control ${validationErrors.amount ? 'error' : ''}`}
                                    placeholder="100"
                                    min="1"
                                    step="1"
                                />
                            </div>
                            {validationErrors.amount && (
                                <div className="error-message" role="alert">
                                    {validationErrors.amount}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="message" className="form-label">
                                Message (Optional)
                            </label>
                            <textarea
                                id="message"
                                {...register('message')}
                                className="form-control"
                                placeholder="Add a personal message..."
                                rows={3}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner" aria-hidden="true"></span>
                                        Processing...
                                    </>
                                ) : (
                                    'Send Gift'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={() => closeModal(setShowSuccessModal)}>
                    <div className="modal success-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Success!</h3>
                            <button
                                className="close-btn"
                                onClick={() => closeModal(setShowSuccessModal)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Your voucher has been sent successfully!</p>
                            <p>
                                Voucher ID: <strong>{voucherId}</strong>
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => closeModal(setShowSuccessModal)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div className="modal-overlay" onClick={() => closeModal(setShowErrorModal)}>
                    <div className="modal error-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Error</h3>
                            <button
                                className="close-btn"
                                onClick={() => closeModal(setShowErrorModal)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>{errorMessage}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => closeModal(setShowErrorModal)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* High Value Confirmation Modal */}
            {showHighValueConfirmModal && (
                <div className="modal-overlay" onClick={() => closeModal(setShowHighValueConfirmModal)}>
                    <div className="modal warning-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirm High-Value Voucher</h3>
                            <button
                                className="close-btn"
                                onClick={() => closeModal(setShowHighValueConfirmModal)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="warning-alert">
                                <h4>You are about to send a high-value voucher!</h4>
                                <p>
                                    You are creating a voucher for <strong>${amount}</strong>.
                                </p>
                                <p>Please confirm that this amount is correct before proceeding.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => closeModal(setShowHighValueConfirmModal)}
                            >
                                Cancel
                            </button>
                            <button className="btn btn-warning" onClick={handleHighValueConfirm}>
                                Confirm Amount
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoucherForm;
