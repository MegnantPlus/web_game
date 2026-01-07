// updates.js - CẬP NHẬT ĐỂ HIỂN THỊ CẢ UPDATES VÀ NOTIFICATIONS
window.updatesData = [];
window.notificationsData = [];

async function loadUpdates() {
    try {
        // Load updates
        const updatesResult = await window.userSystem.getUpdates();
        if (updatesResult.success) {
            window.updatesData = updatesResult.data || [];
        } else {
            window.updatesData = [];
        }
        
        // Load notifications
        const notificationsResult = await window.userSystem.getNotifications();
        if (notificationsResult.success) {
            window.notificationsData = notificationsResult.data || [];
        } else {
            window.notificationsData = [];
        }
        
        renderUpdates();
    } catch (error) {
        console.error('Failed to load data:', error);
        window.updatesData = [];
        window.notificationsData = [];
        renderUpdates();
    }
}

function renderUpdates() {
    const updatesCount = document.getElementById('updatesCount');
    const updatesSlider = document.getElementById('updatesSlider');
    const updatePreviews = document.getElementById('updatePreviews');
    const noUpdates = document.getElementById('noUpdates');
    
    // Tính tổng (updates + notifications)
    const totalItems = window.updatesData.length + window.notificationsData.length;
    if (updatesCount) updatesCount.textContent = `(${totalItems})`;
    
    // Reset indices
    currentPreviewIndex = 0;
    currentUpdateIndex = 0;
    
    // Reset search input
    const searchInput = document.getElementById('searchUpdates');
    if (searchInput) searchInput.value = '';
    
    if (totalItems === 0) {
        if (updatesSlider) updatesSlider.style.display = 'none';
        if (updatePreviews) updatePreviews.style.display = 'none';
        if (noUpdates) noUpdates.style.display = 'block';
        return;
    }
    
    if (currentUser) {
        // ĐÃ LOGIN: Show full slider
        if (updatesSlider) updatesSlider.style.display = 'block';
        if (updatePreviews) updatePreviews.style.display = 'none';
        if (noUpdates) noUpdates.style.display = 'none';
        renderUpdateSlider();
    } else {
        // CHƯA LOGIN: Show locked previews
        if (updatesSlider) updatesSlider.style.display = 'none';
        if (updatePreviews) updatePreviews.style.display = 'block';
        if (noUpdates) noUpdates.style.display = 'none';
        renderUpdatePreviews();
    }
}

function renderUpdateSlider() {
    const slidesContainer = document.getElementById('updateSlides');
    const counter = document.getElementById('updateCounter');
    const dotsContainer = document.getElementById('updateDots');
    const prevBtn = document.getElementById('prevUpdate');
    const nextBtn = document.getElementById('nextUpdate');
    
    if (!slidesContainer) return;
    
    // Kết hợp cả updates và notifications
    const allItems = [
        ...window.notificationsData.map(n => ({...n, type: 'notification'})),
        ...window.updatesData.map(u => ({...u, type: 'update'}))
    ];
    
    if (isShowingAllUpdates) {
        // SHOW ALL
        slidesContainer.innerHTML = allItems.map(item => {
            if (item.type === 'notification') {
                return `
                    <div class="notification-slide">
                        <h3><i class="fas fa-bell"></i> ${item.title || 'Thông báo'}</h3>
                        <div class="notification-content">
                            ${item.content}
                        </div>
                        <div class="notification-meta">
                            <div class="notification-author">
                                <i class="fas fa-user"></i>
                                <span>${item.author?.username || 'System'}</span>
                            </div>
                            <div class="notification-date">
                                <i class="far fa-calendar"></i>
                                <span>${new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="update-slide">
                        <h3><i class="fas fa-newspaper"></i> ${item.title}</h3>
                        <div class="update-content-unlocked">
                            ${item.content}
                        </div>
                        <div class="update-meta">
                            <div class="update-author">
                                <i class="fas fa-user"></i>
                                <span>${item.author}</span>
                            </div>
                            <div class="update-date">
                                <i class="far fa-calendar"></i>
                                <span>${new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        if (counter) counter.textContent = `Tất cả (${allItems.length})`;
        if (dotsContainer) dotsContainer.innerHTML = '';
        
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        
    } else {
        // SHOW SINGLE
        if (allItems.length === 0) return;
        
        const item = allItems[currentUpdateIndex];
        
        if (item.type === 'notification') {
            slidesContainer.innerHTML = `
                <div class="notification-slide">
                    <h3><i class="fas fa-bell"></i> ${item.title || 'Thông báo'}</h3>
                    <div class="notification-content">
                        ${item.content}
                    </div>
                    <div class="notification-meta">
                        <div class="notification-author">
                            <i class="fas fa-user"></i>
                            <span>${item.author?.username || 'System'}</span>
                        </div>
                        <div class="notification-date">
                            <i class="far fa-calendar"></i>
                            <span>${new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            slidesContainer.innerHTML = `
                <div class="update-slide">
                    <h3><i class="fas fa-newspaper"></i> ${item.title}</h3>
                    <div class="update-content-unlocked">
                        ${item.content}
                    </div>
                    <div class="update-meta">
                        <div class="update-author">
                            <i class="fas fa-user"></i>
                            <span>${item.author}</span>
                        </div>
                        <div class="update-date">
                            <i class="far fa-calendar"></i>
                            <span>${new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (counter) counter.textContent = `${currentUpdateIndex + 1} / ${allItems.length}`;
        
        // Create dots
        if (dotsContainer && allItems.length > 1) {
            dotsContainer.innerHTML = allItems.map((_, index) => 
                `<span class="slider-dot ${index === currentUpdateIndex ? 'active' : ''}" onclick="goToSlide(${index})"></span>`
            ).join('');
        }
        
        // Enable/disable buttons
        if (prevBtn) prevBtn.disabled = allItems.length <= 1;
        if (nextBtn) nextBtn.disabled = allItems.length <= 1;
    }
}

function renderUpdatePreviews() {
    const previewsContainer = document.getElementById('updatePreviews');
    if (!previewsContainer) return;
    
    // Kết hợp cả updates và notifications
    const allItems = [
        ...window.notificationsData.map(n => ({...n, type: 'notification'})),
        ...window.updatesData.map(u => ({...u, type: 'update'}))
    ];
    
    if (allItems.length === 0) {
        previewsContainer.innerHTML = `<div class="no-updates"><p>No updates yet</p></div>`;
        return;
    }
    
    // Hiển thị item đầu tiên
    const item = allItems[currentPreviewIndex];
    const isNotification = item.type === 'notification';
    
    previewsContainer.innerHTML = `
        <div class="update-preview ${isNotification ? 'notification-preview' : ''}">
            <h4><i class="fas ${isNotification ? 'fa-bell' : 'fa-newspaper'}"></i> 
                ${isNotification ? 'Thông báo' : 'Update'} #${currentPreviewIndex + 1}
            </h4>
            
            <div style="background: rgba(255,152,0,0.1); border: 1px solid rgba(255,152,0,0.3); 
                        border-radius: 8px; padding: 40px 20px; text-align: center; 
                        color: #FF9800; font-weight: bold; margin: 20px 0;">
                <i class="fas fa-lock"></i> 
                <p style="margin: 10px 0;">Đăng nhập để xem nội dung đầy đủ</p>
                <a onclick="showAuthModal('login')" 
                   style="color: #2196F3; cursor: pointer; text-decoration: underline; font-size: 0.9rem;">
                   Nhấn để đăng nhập
                </a>
            </div>
            
            <div style="color: #666; font-size: 0.9rem;">
                <small><i class="far fa-calendar"></i> ${new Date(item.createdAt).toLocaleDateString()}</small>
            </div>
        </div>
        
        ${allItems.length > 1 ? `
            <div class="preview-navigation">
                <button class="preview-nav-btn" onclick="prevPreviewUpdate()">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span class="preview-counter">${currentPreviewIndex + 1}/${allItems.length}</span>
                <button class="preview-nav-btn" onclick="nextPreviewUpdate()">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        ` : ''}
    `;
}