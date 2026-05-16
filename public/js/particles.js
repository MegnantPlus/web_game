// particles.js - Animated Particle Background System
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };
        this.animationId = null;
        this.isRunning = false;
        
        this.config = {
            particleCount: 80,
            particleMinSize: 1,
            particleMaxSize: 3,
            particleSpeed: 0.4,
            connectionDistance: 150,
            colors: ['#00ff88', '#00d4ff', '#ffd700', 'rgba(255,255,255,0.5)'],
            backgroundColor: 'transparent'
        };
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createParticles();
        this.setupEvents();
        this.start();
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    createParticles() {
        this.particles = [];
        const count = Math.min(this.config.particleCount, Math.floor((this.canvas.width * this.canvas.height) / 15000));
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.config.particleSpeed,
                vy: (Math.random() - 0.5) * this.config.particleSpeed,
                size: Math.random() * (this.config.particleMaxSize - this.config.particleMinSize) + this.config.particleMinSize,
                color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
                opacity: Math.random() * 0.5 + 0.2,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    setupEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
    
    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.02;
            
            // Bounce off edges
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            // Mouse interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.mouse.radius) {
                    const force = (this.mouse.radius - dist) / this.mouse.radius;
                    p.x += dx * force * 0.02;
                    p.y += dy * force * 0.02;
                }
            }
            
            // Keep in bounds
            p.x = Math.max(0, Math.min(this.canvas.width, p.x));
            p.y = Math.max(0, Math.min(this.canvas.height, p.y));
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.config.connectionDistance) {
                    const opacity = (1 - dist / this.config.connectionDistance) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
        
        // Draw particles
        this.particles.forEach(p => {
            const pulseSize = p.size + Math.sin(p.pulse) * 0.5;
            
            // Glow effect
            this.ctx.beginPath();
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseSize * 4);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = p.opacity * 0.3;
            this.ctx.arc(p.x, p.y, pulseSize * 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core particle
            this.ctx.beginPath();
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    animate() {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    start() {
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('particleCanvas')) {
        window.particleSystem = new ParticleSystem('particleCanvas');
    }
});
