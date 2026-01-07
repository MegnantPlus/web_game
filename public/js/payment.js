// payment.js - Payment System with QR Code and Polling
class PaymentSystem {
    constructor() {
        this.pollingInterval = null;
        this.currentOrderCode = null;
        this.pollingAttempts = 0;
        this.maxPollingAttempts = 180; // 6 minutes (180 * 2 seconds)
    }
    
    // Generate QR Code using qrcode.js library
    generateQRCode(elementId, text) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Clear previous QR
        element.innerHTML = '';
        
        // Create new QR Code
        const qrcode = new QRCode(element, {
            text: text,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    
    // Show donation modal
    async showDonateForm() {
        // Remove existing modal if any
        const existingModal = document.querySelector('.donate-modal-overlay');
        if (existingModal) existingModal.remove();
        
        // Create modal
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'donate-modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
            box-sizing: border-box;
            animation: fadeIn 0.3s ease;
        `;
        
        // Get user info if logged in
        const currentUser = window.userSystem ? window.userSystem.getUser() : null;
        const userName = currentUser ? currentUser.username : '';
        const userEmail = currentUser ? (currentUser.email || '') : '';
        
        modalOverlay.innerHTML = `
            <div class="donate-modal-compact">
                <!-- Header -->
                <div style="background: #ff4757; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="color: white; font-weight: bold; font-size: 1.2rem;">
                        <i class="fas fa-heart"></i> ỦNG HỘ WEBSITE
                    </div>
                    <button onclick="window.paymentSystem.closeModal()" 
                            style="background: white; color: #ff4757; border: none; width: 30px; 
                                   height: 30px; border-radius: 50%; font-size: 1.2rem; 
                                   font-weight: bold; cursor: pointer; display: flex; 
                                   align-items: center; justify-content: center; padding: 0;">
                        ×
                    </button>
                </div>
                
                <!-- Body -->
                <div style="padding: 25px; color: white; max-height: 70vh; overflow-y: auto;">
                    ${currentUser ? `
                        <div style="background: rgba(33,150,243,0.2); padding: 10px; border-radius: 8px; 
                                    margin-bottom: 20px; text-align: center; font-size: 0.95rem;">
                            <i class="fas fa-user"></i> ${userName}
                        </div>
                    ` : ''}
                    
                    <!-- Donation Form -->
                    <div id="donateForm">
                        <div style="margin-bottom: 20px;">
                            <div style="color: #aaa; margin-bottom: 10px; font-size: 0.95rem;">
                                <i class="fas fa-money-bill-wave"></i> Số tiền (VNĐ)
                            </div>
                            
                            <!-- Quick amount buttons -->
                            <div class="amount-buttons-grid">
                                ${[10000, 20000, 50000, 100000, 200000, 500000].map(amount => `
                                    <button type="button" class="amount-btn" 
                                            data-amount="${amount}" 
                                            onclick="window.paymentSystem.setAmount(${amount})">
                                        ${amount.toLocaleString('vi-VN')}đ
                                    </button>
                                `).join('')}
                            </div>
                            
                            <!-- Custom amount input -->
                            <div style="position: relative; margin-top: 15px;">
                                <span class="input-symbol">đ</span>
                                <input type="number" id="donateAmount" 
                                       placeholder="Nhập số tiền khác (tối thiểu 10.000đ)" 
                                       min="10000" step="1000"
                                       style="width: 100%; padding: 14px 14px 14px 30px; 
                                              background: rgba(255, 255, 255, 0.1); 
                                              border: 2px solid rgba(255, 255, 255, 0.2); 
                                              border-radius: 8px; color: white; font-size: 1rem; 
                                              box-sizing: border-box;">
                            </div>
                            <div class="amount-validation">
                                <span class="amount-min">Tối thiểu: 10.000đ</span>
                                <span class="amount-max">Tối đa: 10.000.000đ</span>
                            </div>
                        </div>
                        
                        ${!currentUser ? `
                            <!-- Info for non-logged users -->
                            <div style="margin-bottom: 20px;">
                                <input type="text" id="donateName" 
                                       placeholder="Tên của bạn" 
                                       style="width: 100%; padding: 12px; 
                                              background: rgba(255, 255, 255, 0.1); 
                                              border: 2px solid rgba(255, 255, 255, 0.2); 
                                              border-radius: 8px; color: white; 
                                              margin-bottom: 10px; box-sizing: border-box;">
                                
                                <input type="email" id="donateEmail" 
                                       placeholder="email@example.com" 
                                       style="width: 100%; padding: 12px; 
                                              background: rgba(255, 255, 255, 0.1); 
                                              border: 2px solid rgba(255, 255, 255, 0.2); 
                                              border-radius: 8px; color: white; 
                                              box-sizing: border-box;">
                            </div>
                        ` : ''}
                        
                        <!-- Message -->
                        <div style="margin-bottom: 20px;">
                            <textarea id="donateMessage" 
                                      placeholder="Lời nhắn (tùy chọn)" 
                                      style="width: 100%; padding: 12px; 
                                             background: rgba(255, 255, 255, 0.1); 
                                             border: 2px solid rgba(255, 255, 255, 0.2); 
                                             border-radius: 8px; color: white; 
                                             min-height: 80px; resize: vertical;
                                             box-sizing: border-box;"></textarea>
                        </div>
                        
                        <!-- Submit button -->
                        <button onclick="window.paymentSystem.createDonation()" 
                                style="width: 100%; background: linear-gradient(135deg, #4CAF50, #45a049); 
                                       color: white; border: none; padding: 16px; 
                                       border-radius: 8px; font-size: 1.1rem; font-weight: bold; 
                                       cursor: pointer; margin-top: 10px;">
                            <i class="fas fa-qrcode"></i> TẠO MÃ QR THANH TOÁN
                        </button>
                    </div>
                    
                    <!-- QR Code Display -->
                    <div id="qrContainer" class="qr-container" style="display: none;">
                        <h4 style="color: white; margin-bottom: 15px;">
                            <i class="fas fa-qrcode"></i> Quét mã QR để thanh toán
                        </h4>
                        
                        <div id="qrCodeImage"></div>
                        
                        <div class="qr-info">
                            <div>
                                <span>Số tiền:</span>
                                <strong id="qrAmount">0 đ</strong>
                            </div>
                            <div>
                                <span>Mã đơn hàng:</span>
                                <strong id="qrOrderCode">-</strong>
                            </div>
                            <div>
                                <span>Trạng thái:</span>
                                <strong id="qrStatus">Đang chờ...</strong>
                            </div>
                        </div>
                        
                        <div id="pollingStatus" class="polling-status pending">
                            <div class="polling-loader"></div>
                            <span>Đang kiểm tra thanh toán...</span>
                        </div>
                        
                        <div id="paymentResult" class="payment-result" style="display: none;">
                            <div class="payment-success">
                                <i class="fas fa-check-circle"></i>
                                <h3>THANH TOÁN THÀNH CÔNG!</h3>
                                <p>Cảm ơn bạn đã ủng hộ!</p>
                            </div>
                            <button onclick="window.paymentSystem.closeModal()" 
                                    style="background: #2196F3; color: white; border: none; 
                                           padding: 12px 24px; border-radius: 8px; 
                                           cursor: pointer; margin-top: 15px;">
                                Đóng
                            </button>
                        </div>
                        
                        <div style="color: #888; font-size: 0.8rem; margin-top: 15px; text-align: center;">
                            <i class="fas fa-info-circle"></i> 
                            Vui lòng quét mã QR bằng ứng dụng ngân hàng của bạn
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Load QRCode library if not loaded
        if (typeof QRCode === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
            document.head.appendChild(script);
        }
        
        // Setup amount buttons
        this.setupAmountButtons();
        
        // Focus on amount input
        setTimeout(() => {
            document.getElementById('donateAmount').focus();
        }, 100);
    }
    
    setupAmountButtons() {
        const buttons = document.querySelectorAll('.amount-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                buttons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
            });
        });
    }
    
    setAmount(amount) {
        const input = document.getElementById('donateAmount');
        if (input) {
            input.value = amount;
            
            // Highlight the button
            const buttons = document.querySelectorAll('.amount-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.dataset.amount) === amount) {
                    btn.classList.add('active');
                }
            });
        }
    }
    
    async createDonation() {
        const amountInput = document.getElementById('donateAmount');
        const amount = parseInt(amountInput.value);
        
        // Validate amount
        if (!amount || isNaN(amount) || amount < 10000) {
            this.showNotification('Vui lòng nhập số tiền tối thiểu 10.000 VNĐ', 'error');
            amountInput.focus();
            return;
        }
        
        if (amount > 10000000) {
            this.showNotification('Số tiền tối đa là 10.000.000 VNĐ', 'error');
            return;
        }
        
        const message = document.getElementById('donateMessage').value.trim();
        const currentUser = window.userSystem ? window.userSystem.getUser() : null;
        
        let name = '', email = '';
        if (currentUser) {
            name = currentUser.username;
            email = currentUser.email || '';
        } else {
            name = document.getElementById('donateName').value.trim();
            email = document.getElementById('donateEmail').value.trim();
            
            if (!name || name.length < 2) {
                this.showNotification('Vui lòng nhập tên (ít nhất 2 ký tự)', 'error');
                document.getElementById('donateName').focus();
                return;
            }
            
            if (!email || !this.isValidEmail(email)) {
                this.showNotification('Email không hợp lệ', 'error');
                document.getElementById('donateEmail').focus();
                return;
            }
        }
        
        // Show loading
        document.getElementById('donateForm').style.opacity = '0.5';
        document.getElementById('donateForm').style.pointerEvents = 'none';
        
        try {
            // Call API to create payment
            const result = await window.userSystem.createPayment(amount, message || 'Ủng hộ website');
            
            if (result.success && result.checkoutUrl && result.qrCode) {
                // Store order code
                const orderCode = result.orderCode || this.extractOrderCode(result.checkoutUrl);
                this.currentOrderCode = orderCode;
                
                // Show QR container
                document.getElementById('donateForm').style.display = 'none';
                document.getElementById('qrContainer').style.display = 'block';
                
                // Update info
                document.getElementById('qrAmount').textContent = amount.toLocaleString('vi-VN') + 'đ';
                document.getElementById('qrOrderCode').textContent = orderCode;
                
                // Generate QR code
                this.generateQRCode('qrCodeImage', result.qrCode);
                
                // Start polling
                this.startPolling(orderCode);
                
            } else {
                this.showNotification(result.error || 'Không thể tạo mã QR. Vui lòng thử lại!', 'error');
            }
        } catch (error) {
            this.showNotification('Lỗi kết nối. Vui lòng thử lại!', 'error');
            console.error('Payment error:', error);
        } finally {
            // Reset form state
            document.getElementById('donateForm').style.opacity = '';
            document.getElementById('donateForm').style.pointerEvents = '';
        }
    }
    
    extractOrderCode(checkoutUrl) {
        // Extract order code from checkout URL
        const match = checkoutUrl.match(/payment-link\/(\w+)/);
        return match ? match[1] : 'ORDER_' + Date.now().toString().slice(-8);
    }
    
    startPolling(orderCode) {
        // Clear any existing polling
        this.stopPolling();
        
        this.pollingAttempts = 0;
        
        this.pollingInterval = setInterval(async () => {
            this.pollingAttempts++;
            
            if (this.pollingAttempts > this.maxPollingAttempts) {
                this.stopPolling();
                this.showPollingStatus('Hết thời gian chờ thanh toán. Vui lòng thử lại!', 'error');
                return;
            }
            
            try {
                const result = await window.userSystem.checkPaymentStatus(orderCode);
                
                if (result.success && result.data) {
                    const status = result.data.status;
                    
                    if (status === 'PAID') {
                        // Payment successful!
                        this.stopPolling();
                        this.showPaymentSuccess();
                        
                        // Save donation to history
                        this.saveDonationHistory(result.data);
                        
                    } else if (status === 'CANCELLED' || status === 'EXPIRED') {
                        this.stopPolling();
                        this.showPollingStatus('Đơn hàng đã hết hạn hoặc bị hủy!', 'error');
                    } else {
                        // Still pending
                        const remainingTime = Math.floor((this.maxPollingAttempts - this.pollingAttempts) * 2 / 60);
                        this.showPollingStatus(`Đang chờ thanh toán... (còn khoảng ${remainingTime} phút)`);
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000); // Check every 2 seconds
    }
    
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    
    showPollingStatus(message, type = 'pending') {
        const statusElement = document.getElementById('pollingStatus');
        const statusText = document.getElementById('qrStatus');
        
        if (statusElement && statusText) {
            statusElement.className = `polling-status ${type}`;
            statusElement.innerHTML = type === 'pending' 
                ? `<div class="polling-loader"></div><span>${message}</span>`
                : `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
            
            statusText.textContent = message;
            statusText.style.color = type === 'pending' ? '#FFC107' : 
                                   type === 'success' ? '#4CAF50' : '#f44336';
        }
    }
    
    showPaymentSuccess() {
        const qrContainer = document.getElementById('qrContainer');
        const pollingStatus = document.getElementById('pollingStatus');
        const paymentResult = document.getElementById('paymentResult');
        
        if (qrContainer && pollingStatus && paymentResult) {
            // Update status
            document.getElementById('qrStatus').textContent = 'Đã thanh toán';
            document.getElementById('qrStatus').style.color = '#4CAF50';
            
            // Hide polling status, show success
            pollingStatus.style.display = 'none';
            paymentResult.style.display = 'block';
            
            // Add confetti effect
            this.showConfetti();
            
            // Play success sound if available
            this.playSuccessSound();
        }
    }
    
    showConfetti() {
        // Simple confetti effect
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 10000;
        `;
        
        document.body.appendChild(confettiContainer);
        
        // Create confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${['#ff4757', '#4CAF50', '#2196F3', '#FFC107'][Math.floor(Math.random() * 4)]};
                border-radius: 2px;
                top: -20px;
                left: ${Math.random() * 100}vw;
                animation: fall ${Math.random() * 3 + 2}s linear forwards;
            `;
            
            // Add animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                        opacity: 0;
                    }
                }
            `;
            confettiContainer.appendChild(style);
            confettiContainer.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                if (confetti.parentElement) confetti.remove();
            }, 5000);
        }
        
        // Remove container after animation
        setTimeout(() => {
            if (confettiContainer.parentElement) confettiContainer.remove();
        }, 5000);
    }
    
    playSuccessSound() {
        // Simple success sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 523.25; // C5
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }
    
    saveDonationHistory(paymentData) {
        try {
            const donations = JSON.parse(localStorage.getItem('pickleball_donations') || '[]');
            
            const donation = {
                id: Date.now(),
                orderCode: this.currentOrderCode,
                amount: paymentData.amount,
                status: 'completed',
                paidAt: new Date().toISOString(),
                timestamp: Date.now()
            };
            
            donations.push(donation);
            localStorage.setItem('pickleball_donations', JSON.stringify(donations));
            
            console.log('Donation saved:', donation);
        } catch (error) {
            console.error('Failed to save donation:', error);
        }
    }
    
    closeModal() {
        this.stopPolling();
        const modal = document.querySelector('.donate-modal-overlay');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                if (modal.parentElement) modal.remove();
            }, 300);
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    showNotification(message, type = 'info') {
        // Reuse existing notification function or create simple one
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            // Simple notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#4CAF50' : '#2196F3'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10001;
                animation: slideIn 0.3s ease;
                max-width: 300px;
            `;
            notification.innerHTML = `
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                <span style="margin-left: 10px;">${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) notification.remove();
            }, 3000);
        }
    }
}

// Create global instance
window.paymentSystem = new PaymentSystem();