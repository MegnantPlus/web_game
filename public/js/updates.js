// updates.js - Update Slider System
class UpdatesSlider {
    constructor() {
        this.currentIndex = 0;
        this.isShowingAll = false;
        this.updates = [];
        this.initialize();
    }
    
    initialize() {
        this.loadUpdates();
    }
    
    loadUpdates() {
        // Get updates from userSystem
        if (window.userSystem) {
            this.updates = userSystem.getVisibleUpdates();
            // Sort by newest first
            this.updates.sort((a, b) => b.createdAt - a.createdAt);
        }
    }
    
    renderSlider() {
        const slider = document.getElementById('updatesSlider');
        const previews = document.getElementById('updatePreviews');
        const noUpdates = document.getElementById('noUpdates');
        
        if (!this.updates || this.updates.length === 0) {
            if (slider) slider.style.display = 'none';
            if (previews) previews.style.display = 'none';
            if (noUpdates) noUpdates.style.display = 'block';
            return;
        }
        
        const isLoggedIn = window.userSystem && userSystem.isLoggedIn();
        
        if (isLoggedIn) {
            // Show full slider for logged in users
            if (slider) slider.style.display = 'block';
            if (previews) previews.style.display = 'none';
            if (noUpdates) noUpdates.style.display = 'none';
            this.renderLoggedInView();
        } else {
            // Show previews for non-logged users
            if (slider) slider.style.display = 'none';
            if (previews) previews.style.display = 'block';
            if (noUpdates) noUpdates.style.display = 'none';
            this.renderPreviewView();
        }
    }
    
    renderLoggedInView() {
        const slidesContainer = document.getElementById('updateSlides');
        const counter = document.getElementById('updateCounter');
        const dotsContainer = document.getElementById('updateDots');
        
        if (!slidesContainer) return;
        
        if (this.isShowingAll) {
            // Show all updates
            slidesContainer.innerHTML = this.updates.map(update => this.createUpdateHTML(update)).join('');
            if (counter) counter.textContent = `Showing all (${this.updates.length})`;
            if (dotsContainer) dotsContainer.innerHTML = '';
        } else {
            // Show single slide
            const update = this.updates[this.currentIndex];
            slidesContainer.innerHTML = this.createUpdateHTML(update);
            if (counter) counter.textContent = `${this.currentIndex + 1} / ${this.updates.length}`;
            
            // Update dots
            if (dotsContainer) {
                dotsContainer.innerHTML = this.updates.map((_, index) => 
                    `<span class="slider-dot ${index === this.currentIndex ? 'active' : ''}" 
                          onclick="updatesSlider.goToSlide(${index})"></span>`
                ).join('');
            }
        }
        
        // Update controls
        this.updateControls();
    }
    
    renderPreviewView() {
        const previewsContainer = document.getElementById('updatePreviews');
        if (!previewsContainer) return;
        
        previewsContainer.innerHTML = this.updates.map(update => `
            <div class="update-preview">
                <h4><i class="fas fa-newspaper"></i> ${update.title}</h4>
                <div class="preview-content">
                    ${update.content.substring(0, 150)}${update.content.length > 150 ? '...' : ''}
                </div>
                <div class="preview-login-prompt">
                    <i class="fas fa-lock"></i> 
                    <a onclick="showAuthModal('login')">Login to read full update</a>
                </div>
                <div class="update-meta">
                    <div class="update-author">
                        <i class="fas fa-user"></i>
                        <span>${update.author}</span>
                    </div>
                    <div class="update-date">
                        <i class="far fa-calendar"></i>
                        <span>${new Date(update.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    createUpdateHTML(update) {
        return `
            <div class="update-slide">
                <h3><i class="fas fa-newspaper"></i> ${update.title}</h3>
                <div class="update-content">${update.content}</div>
                <div class="update-meta">
                    <div class="update-author">
                        <i class="fas fa-user"></i>
                        <span>${update.author}</span>
                    </div>
                    <div class="update-date">
                        <i class="far fa-calendar"></i>
                        <span>${new Date(update.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    updateControls() {
        const prevBtn = document.getElementById('prevUpdate');
        const nextBtn = document.getElementById('nextUpdate');
        const showAllBtn = document.getElementById('showAllUpdates');
        
        if (prevBtn) {
            prevBtn.disabled = this.isShowingAll || this.updates.length <= 1;
            prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.isShowingAll || this.updates.length <= 1;
            nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
        }
        
        if (showAllBtn) {
            showAllBtn.innerHTML = this.isShowingAll ? 
                '<i class="fas fa-times"></i> Show Single' : 
                '<i class="fas fa-list"></i> Show All';
        }
    }
    
    nextSlide() {
        if (this.updates.length <= 1 || this.isShowingAll) return;
        this.currentIndex = (this.currentIndex + 1) % this.updates.length;
        this.renderSlider();
    }
    
    prevSlide() {
        if (this.updates.length <= 1 || this.isShowingAll) return;
        this.currentIndex = (this.currentIndex - 1 + this.updates.length) % this.updates.length;
        this.renderSlider();
    }
    
    goToSlide(index) {
        if (index >= 0 && index < this.updates.length && !this.isShowingAll) {
            this.currentIndex = index;
            this.renderSlider();
        }
    }
    
    toggleShowAll() {
        this.isShowingAll = !this.isShowingAll;
        this.renderSlider();
    }
    
    filterUpdates() {
        const searchTerm = document.getElementById('searchUpdates')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('filterUpdates')?.value || 'recent';
        
        let filtered = userSystem.getVisibleUpdates();
        
        if (searchTerm) {
            filtered = filtered.filter(update => 
                update.title.toLowerCase().includes(searchTerm) || 
                update.content.toLowerCase().includes(searchTerm) ||
                update.author.toLowerCase().includes(searchTerm)
            );
        }
        
        // Always show recent first (remove oldest option)
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        
        this.updates = filtered;
        this.currentIndex = 0;
        this.isShowingAll = false;
        
        this.renderSlider();
        
        // Update count
        const updatesCount = document.getElementById('updatesCount');
        if (updatesCount) updatesCount.textContent = `(${filtered.length})`;
    }
}

// Create global instance
window.updatesSlider = new UpdatesSlider();