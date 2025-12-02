/**
 * 动态背景效果
 * 包含漂浮的光球和微风粒子效果
 */

class DynamicBackground {
    constructor() {
        this.container = document.getElementById('dynamic-bg');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'dynamic-bg';
            document.body.prepend(this.container);
        }
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        this.particles = [];
        this.orbs = [];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.initOrbs();
        this.initParticles();
        this.animate();
    }
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    initOrbs() {
        // 创建3个大的柔光球
        const colors = [
            'rgba(212, 175, 55, 0.15)', // 金色
            'rgba(255, 149, 0, 0.1)',   // 橙色
            'rgba(0, 122, 255, 0.05)'   // 蓝色
        ];
        
        for (let i = 0; i < 3; i++) {
            this.orbs.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 300 + Math.random() * 200,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                color: colors[i]
            });
        }
    }
    
    initParticles() {
        // 创建微风粒子
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                vx: Math.random() * 0.5 + 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                opacity: Math.random() * 0.5
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制光球
        this.orbs.forEach(orb => {
            orb.x += orb.vx;
            orb.y += orb.vy;
            
            // 边界反弹
            if (orb.x < -orb.radius || orb.x > this.width + orb.radius) orb.vx *= -1;
            if (orb.y < -orb.radius || orb.y > this.height + orb.radius) orb.vy *= -1;
            
            const gradient = this.ctx.createRadialGradient(
                orb.x, orb.y, 0,
                orb.x, orb.y, orb.radius
            );
            gradient.addColorStop(0, orb.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 绘制粒子
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // 循环移动
            if (p.x > this.width) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y = 0;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new DynamicBackground();
});
