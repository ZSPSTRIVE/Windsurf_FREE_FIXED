/**
 * 动态背景效果 - 几何图形版 (Neo-Brutalism)
 * 包含漂浮的几何图形（三角形、圆形、矩形、十字）
 */

class DynamicBackground {
    constructor() {
        this.container = document.getElementById('dynamic-bg');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'dynamic-bg';
            document.body.prepend(this.container);
        }
        
        // 清除旧内容
        this.container.innerHTML = '';
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        this.shapes = [];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.initShapes();
        this.animate();
    }
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    initShapes() {
        const colors = ['#FFD600', '#2B59C3', '#FF2E63', '#00C897', '#FF6B35'];
        const types = ['circle', 'square', 'triangle', 'cross'];
        
        // 创建15个漂浮的几何图形
        for (let i = 0; i < 15; i++) {
            this.shapes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 20 + Math.random() * 40,
                type: types[Math.floor(Math.random() * types.length)],
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                rotation: Math.random() * Math.PI * 2,
                vRotation: (Math.random() - 0.5) * 0.02
            });
        }
    }
    
    drawShape(ctx, shape) {
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);
        ctx.fillStyle = shape.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        
        switch(shape.type) {
            case 'circle':
                ctx.arc(0, 0, shape.size/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
            case 'square':
                ctx.rect(-shape.size/2, -shape.size/2, shape.size, shape.size);
                ctx.fill();
                ctx.stroke();
                break;
            case 'triangle':
                ctx.moveTo(0, -shape.size/2);
                ctx.lineTo(shape.size/2, shape.size/2);
                ctx.lineTo(-shape.size/2, shape.size/2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'cross':
                const w = shape.size / 3;
                const l = shape.size;
                ctx.rect(-w/2, -l/2, w, l);
                ctx.rect(-l/2, -w/2, l, w);
                ctx.fill();
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.shapes.forEach(shape => {
            shape.x += shape.vx;
            shape.y += shape.vy;
            shape.rotation += shape.vRotation;
            
            // 边界反弹
            if (shape.x < -100) shape.x = this.width + 100;
            if (shape.x > this.width + 100) shape.x = -100;
            if (shape.y < -100) shape.y = this.height + 100;
            if (shape.y > this.height + 100) shape.y = -100;
            
            this.drawShape(this.ctx, shape);
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new DynamicBackground();
});
