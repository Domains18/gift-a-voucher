document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('giftVoucherForm');
    const recipientTypeSelect = document.getElementById('recipientType');
    const emailField = document.getElementById('emailField');
    const walletField = document.getElementById('walletField');
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    
    // Toggle between email and wallet address fields
    recipientTypeSelect.addEventListener('change', function() {
        if (this.value === 'email') {
            emailField.classList.remove('d-none');
            walletField.classList.add('d-none');
            document.getElementById('walletAddress').value = '';
        } else {
            emailField.classList.add('d-none');
            walletField.classList.remove('d-none');
            document.getElementById('recipientEmail').value = '';
        }
    });
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset validation
        resetValidation();
        
        // Get form values
        const recipientType = recipientTypeSelect.value;
        const recipientEmail = document.getElementById('recipientEmail').value;
        const walletAddress = document.getElementById('walletAddress').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const message = document.getElementById('message').value;
        
        // Validate form
        let isValid = true;
        
        if (recipientType === 'email' && !validateEmail(recipientEmail)) {
            document.getElementById('recipientEmail').classList.add('is-invalid');
            isValid = false;
        }
        
        if (recipientType === 'wallet' && !validateWalletAddress(walletAddress)) {
            document.getElementById('walletAddress').classList.add('is-invalid');
            isValid = false;
        }
        
        if (isNaN(amount) || amount < 1) {
            document.getElementById('amount').classList.add('is-invalid');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // Prepare request payload
        const payload = {
            amount: amount
        };
        
        if (recipientType === 'email') {
            payload.recipientEmail = recipientEmail;
        } else {
            payload.walletAddress = walletAddress;
        }
        
        if (message.trim()) {
            payload.message = message;
        }
        
        try {
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
            
            // Send API request
            const response = await fetch('/api/vouchers/gift', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            
            if (response.ok && data.success) {
                // Show success modal
                document.getElementById('voucherId').textContent = data.data.id;
                form.reset();
                successModal.show();
                
                // Simulate processing the voucher (for demo purposes)
                simulateProcessVoucher(payload);
            } else {
                // Show error modal
                let errorMessage = 'Failed to process your request.';
                if (data.error) {
                    if (typeof data.error === 'string') {
                        errorMessage = data.error;
                    } else {
                        errorMessage = 'Validation error. Please check your input.';
                    }
                }
                document.getElementById('errorMessage').textContent = errorMessage;
                errorModal.show();
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('errorMessage').textContent = 'Network error. Please try again.';
            errorModal.show();
        }
    });
    
    // Helper functions
    function resetValidation() {
        const invalidInputs = form.querySelectorAll('.is-invalid');
        invalidInputs.forEach(input => input.classList.remove('is-invalid'));
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validateWalletAddress(address) {
        // Simple validation for demonstration
        // In a real app, you would use a more sophisticated validation
        return address.trim().length >= 10;
    }
    
    // For demonstration purposes - simulate processing the voucher
    async function simulateProcessVoucher(payload) {
        try {
            await fetch('/api/simulate/process-voucher', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            console.log('Voucher processing simulated');
        } catch (error) {
            console.error('Error simulating voucher processing:', error);
        }
    }
});
