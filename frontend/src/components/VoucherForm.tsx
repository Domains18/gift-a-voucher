import React, { useState, FormEvent } from 'react';
import { Card, Form, Button, InputGroup, Modal } from 'react-bootstrap';
import { giftVoucher, VoucherGiftRequest } from '../services/api';

interface FormData {
    recipientType: 'email' | 'wallet';
    recipientEmail: string;
    walletAddress: string;
    amount: string;
    message: string;
}

interface ValidationErrors {
    recipientEmail?: string;
    walletAddress?: string;
    amount?: string;
}

const VoucherForm: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        recipientType: 'email',
        recipientEmail: '',
        walletAddress: '',
        amount: '',
        message: '',
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [voucherId, setVoucherId] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear errors when user types
        if (errors[name as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleRecipientTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as 'email' | 'wallet';
        setFormData(prev => ({
            ...prev,
            recipientType: value,
            recipientEmail: value === 'email' ? prev.recipientEmail : '',
            walletAddress: value === 'wallet' ? prev.walletAddress : '',
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};
        let isValid = true;

        if (formData.recipientType === 'email' && !validateEmail(formData.recipientEmail)) {
            newErrors.recipientEmail = 'Please enter a valid email address';
            isValid = false;
        }

        if (formData.recipientType === 'wallet' && !validateWalletAddress(formData.walletAddress)) {
            newErrors.walletAddress = 'Please enter a valid wallet address';
            isValid = false;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount < 1) {
            newErrors.amount = 'Please enter a valid amount (minimum $1)';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validateWalletAddress = (address: string): boolean => {
        return address.trim().length >= 10;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: VoucherGiftRequest = {
                amount: parseFloat(formData.amount),
            };

            if (formData.recipientType === 'email') {
                payload.recipientEmail = formData.recipientEmail;
            } else {
                payload.walletAddress = formData.walletAddress;
            }

            if (formData.message.trim()) {
                payload.message = formData.message;
            }

            const response = await giftVoucher(payload);

            setVoucherId(response.data.id);
            setShowSuccessModal(true);

            setFormData({
                recipientType: 'email',
                recipientEmail: '',
                walletAddress: '',
                amount: '',
                message: '',
            });
        } catch (error: any) {
            setErrorMessage(error.message || 'Failed to process your request');
            setShowErrorModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card className="shadow-lg">
                <Card.Header className="bg-primary text-white">
                    <h2 className="text-center mb-0">Gift a Voucher</h2>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Send To</Form.Label>
                            <Form.Select
                                name="recipientType"
                                value={formData.recipientType}
                                onChange={handleRecipientTypeChange}
                            >
                                <option value="email">Email Address</option>
                                <option value="wallet">Wallet Address</option>
                            </Form.Select>
                        </Form.Group>

                        {formData.recipientType === 'email' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Recipient Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="recipientEmail"
                                    value={formData.recipientEmail}
                                    onChange={handleChange}
                                    placeholder="recipient@example.com"
                                    isInvalid={!!errors.recipientEmail}
                                />
                                <Form.Control.Feedback type="invalid">{errors.recipientEmail}</Form.Control.Feedback>
                            </Form.Group>
                        )}

                        {formData.recipientType === 'wallet' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Wallet Address</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="walletAddress"
                                    value={formData.walletAddress}
                                    onChange={handleChange}
                                    placeholder="0x..."
                                    isInvalid={!!errors.walletAddress}
                                />
                                <Form.Control.Feedback type="invalid">{errors.walletAddress}</Form.Control.Feedback>
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Amount</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>$</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="100"
                                    min="1"
                                    step="1"
                                    isInvalid={!!errors.amount}
                                />
                                <Form.Control.Feedback type="invalid">{errors.amount}</Form.Control.Feedback>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Message (Optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Add a personal message..."
                                rows={3}
                            />
                        </Form.Group>

                        <div className="d-grid gap-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                        Processing...
                                    </>
                                ) : (
                                    'Send Gift'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Success Modal */}
            <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)}>
                <Modal.Header className="bg-success text-white">
                    <Modal.Title>Success!</Modal.Title>
                    <Button variant="close" onClick={() => setShowSuccessModal(false)} aria-label="Close" />
                </Modal.Header>
                <Modal.Body>
                    <p>Your voucher has been sent successfully!</p>
                    <p>
                        Voucher ID: <strong>{voucherId}</strong>
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Error Modal */}
            <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)}>
                <Modal.Header className="bg-danger text-white">
                    <Modal.Title>Error</Modal.Title>
                    <Button variant="close" onClick={() => setShowErrorModal(false)} aria-label="Close" />
                </Modal.Header>
                <Modal.Body>
                    <p>{errorMessage}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default VoucherForm;
