// payment.js - SIMPLIFIED AND WORKING VERSION
class PaymentSystem {
    constructor() {
        this.pollingInterval = null;
        this.currentOrderCode = null;
        this.pollingAttempts = 0;
        this.maxPollingAttempts = 60; // 2 minutes (60 * 2 seconds)
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
                        
                        <div id="qrCodeImage" style="margin: 20px 0;"></div>
                        
                        <div class="qr-info" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span>Số tiền:</span>
                                <strong id="qrAmount" style="color: #4CAF50;">0 đ</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span>Mã đơn hàng:</span>
                                <strong id="qrOrderCode" style="font-family: monospace;">-</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span>Trạng thái:</span>
                                <strong id="qrStatus" style="color: #FFC107;">Đang chờ...</strong>
                            </div>
                        </div>
                        
                        <div id="pollingStatus" style="text-align: center; padding: 15px; border-radius: 8px; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); margin-bottom: 15px;">
                            <div class="polling-loader" style="display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: #2196F3; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
                            <span id="pollingText">Đang kiểm tra thanh toán...</span>
                        </div>
                        
                        <div id="paymentResult" style="display: none; text-align: center; padding: 20px; background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 8px;">
                            <div class="payment-success">
                                <i class="fas fa-check-circle" style="font-size: 4rem; color: #4CAF50; margin-bottom: 15px;"></i>
                                <h3 style="color: #4CAF50; margin-bottom: 10px;">THANH TOÁN THÀNH CÔNG!</h3>
                                <p style="color: #ddd; margin-bottom: 20px;">Cảm ơn bạn đã ủng hộ!</p>
                            </div>
                            <button onclick="window.paymentSystem.closeModal()" 
                                    style="background: #2196F3; color: white; border: none; 
                                           padding: 12px 24px; border-radius: 8px; 
                                           cursor: pointer; font-weight: bold;">
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
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    setAmount(amount) {
        const input = document.getElementById('donateAmount');
        if (input) {
            input.value = amount;
            
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
            console.log('💰 Creating payment for amount:', amount);
            const result = await window.userSystem.createPayment(amount, message || 'Ủng hộ website');
            
            console.log('💰 Payment creation result:', result);
            
            if (result.success && result.checkoutUrl && result.qrCode) {
                // Store order code
                const orderCode = result.orderCode || result.checkoutUrl.split('/').pop() || 'ORDER_' + Date.now().toString().slice(-8);
                this.currentOrderCode = orderCode;
                
                // Show QR container
                document.getElementById('donateForm').style.display = 'none';
                document.getElementById('qrContainer').style.display = 'block';
                
                // Update info
                document.getElementById('qrAmount').textContent = amount.toLocaleString('vi-VN') + 'đ';
                document.getElementById('qrOrderCode').textContent = orderCode;
                document.getElementById('qrStatus').textContent = 'ĐANG CHỜ THANH TOÁN';
                document.getElementById('qrStatus').style.color = '#FFC107';
                
                // Hide payment result if visible
                document.getElementById('paymentResult').style.display = 'none';
                
                // Show polling status
                document.getElementById('pollingStatus').style.display = 'block';
                document.getElementById('pollingText').textContent = 'Đang kiểm tra thanh toán...';
                
                // Generate QR code
                this.generateQRCode('qrCodeImage', result.qrCode);
                
                // Start SIMPLE polling
                this.startSimplePolling(orderCode);
                
                this.showNotification('✅ Đã tạo mã QR thành công!', 'success');
                
            } else {
                this.showNotification(result.error || 'Không thể tạo mã QR', 'error');
            }
        } catch (error) {
            console.error('Payment creation error:', error);
            this.showNotification('Lỗi kết nối: ' + error.message, 'error');
        } finally {
            // Reset form state
            document.getElementById('donateForm').style.opacity = '';
            document.getElementById('donateForm').style.pointerEvents = '';
        }
    }
    
    // SIMPLE POLLING - chỉ kiểm tra đơn giản
    startSimplePolling(orderCode) {
        console.log(`🔍 Bắt đầu polling đơn giản cho: ${orderCode}`);
        
        // Clear any existing polling
        this.stopPolling();
        
        // Reset attempts
        this.pollingAttempts = 0;
        
        // Start polling
        this.pollingInterval = setInterval(async () => {
            this.pollingAttempts++;
            
            if (this.pollingAttempts > this.maxPollingAttempts) {
                console.log('⏰ Timeout polling');
                this.stopPolling();
                document.getElementById('pollingText').textContent = 'Hết thời gian chờ';
                document.getElementById('pollingStatus').style.background = 'rgba(255, 71, 87, 0.1)';
                document.getElementById('pollingStatus').style.borderColor = 'rgba(255, 71, 87, 0.3)';
                return;
            }
            
            try {
                console.log(`🔄 Kiểm tra lần ${this.pollingAttempts} cho order: ${orderCode}`);
                
                // Gọi API kiểm tra trạng thái
                const result = await window.userSystem.checkPaymentStatus(orderCode);
                console.log('📡 Kết quả kiểm tra:', result);
                
                if (result.success) {
                    // XỬ LÝ KẾT QUẢ TỪ BACKEND THẬT
                    const paymentData = result.data || result;
                    const status = paymentData.status || paymentData.paymentStatus;
                    
                    console.log('💰 Trạng thái thanh toán:', status);
                    
                    // Cập nhật trạng thái hiển thị
                    this.updateStatusDisplay(status);
                    
                    // Nếu thanh toán thành công
                    if (status === 'PAID' || status === 'SUCCESS' || status === 'paid' || status === 'success') {
                        console.log('✅ PHÁT HIỆN THANH TOÁN THÀNH CÔNG!');
                        this.handlePaymentSuccess(paymentData);
                        return;
                    }
                    
                    // Nếu thất bại
                    if (status === 'CANCELLED' || status === 'EXPIRED' || status === 'FAILED') {
                        console.log('❌ Thanh toán thất bại');
                        this.stopPolling();
                        document.getElementById('pollingText').textContent = 'Thanh toán thất bại';
                        document.getElementById('qrStatus').textContent = 'THẤT BẠI';
                        document.getElementById('qrStatus').style.color = '#ff4757';
                        return;
                    }
                    
                    // Vẫn đang chờ
                    const remainingMinutes = Math.floor((this.maxPollingAttempts - this.pollingAttempts) * 2 / 60);
                    document.getElementById('pollingText').textContent = `Đang chờ... (còn ~${remainingMinutes} phút)`;
                    
                } else {
                    console.log('⚠️ Kiểm tra không thành công:', result.error);
                    document.getElementById('pollingText').textContent = `Đang thử lại... (${this.pollingAttempts}/${this.maxPollingAttempts})`;
                }
                
            } catch (error) {
                console.error('❌ Lỗi khi kiểm tra:', error);
                document.getElementById('pollingText').textContent = `Lỗi kết nối, thử lại...`;
            }
        }, 2000); // Kiểm tra mỗi 2 giây
    }
    
    updateStatusDisplay(status) {
        const qrStatus = document.getElementById('qrStatus');
        if (!qrStatus) return;
        
        const statusMap = {
            'PAID': { text: 'ĐÃ THANH TOÁN', color: '#4CAF50' },
            'SUCCESS': { text: 'THÀNH CÔNG', color: '#4CAF50' },
            'paid': { text: 'ĐÃ THANH TOÁN', color: '#4CAF50' },
            'success': { text: 'THÀNH CÔNG', color: '#4CAF50' },
            'PENDING': { text: 'ĐANG CHỜ', color: '#FFC107' },
            'pending': { text: 'ĐANG CHỜ', color: '#FFC107' },
            'CANCELLED': { text: 'ĐÃ HỦY', color: '#ff4757' },
            'EXPIRED': { text: 'HẾT HẠN', color: '#ff4757' },
            'FAILED': { text: 'THẤT BẠI', color: '#ff4757' }
        };
        
        const display = statusMap[status] || { text: 'ĐANG XỬ LÝ', color: '#aaa' };
        qrStatus.textContent = display.text;
        qrStatus.style.color = display.color;
    }
    
    handlePaymentSuccess(paymentData) {
        console.log('🎉 Xử lý thanh toán thành công');
        
        // Dừng polling
        this.stopPolling();
        
        // Ẩn polling status
        document.getElementById('pollingStatus').style.display = 'none';
        
        // Hiển thị kết quả thành công
        document.getElementById('paymentResult').style.display = 'block';
        
        // Cập nhật trạng thái QR
        document.getElementById('qrStatus').textContent = 'THÀNH CÔNG';
        document.getElementById('qrStatus').style.color = '#4CAF50';
        document.getElementById('qrStatus').style.fontWeight = 'bold';
        
        // Lưu vào lịch sử
        this.saveDonationHistory(paymentData);
        
        // Hiệu ứng confetti
        this.showConfetti();
        
        // Thông báo
        this.showNotification('🎉 Thanh toán thành công! Cảm ơn bạn!', 'success');
    }
    
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('🛑 Đã dừng polling');
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
            
            console.log('💾 Đã lưu vào lịch sử:', donation);
        } catch (error) {
            console.error('❌ Lỗi khi lưu lịch sử:', error);
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
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
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
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            notification.innerHTML = `
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                <span>${message}</span>
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

// Add CSS animations
if (!document.querySelector('#payment-animations')) {
    const style = document.createElement('style');
    style.id = 'payment-animations';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fall {
            to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}