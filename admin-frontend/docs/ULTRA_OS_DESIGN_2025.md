# Ultra OS Design 2025

## 旗舰级视觉规范

融合 **iOS/macOS**、**OPPO ColorOS**、**HarmonyOS**、**VIVO OriginOS** 设计精髓，打造真正系统级 + 高级感 + 可落地的旗舰配色。

---

## 1. 核心主色系 - 星际蓝紫

摒弃市场上泛滥的"通用主题蓝/绿"，采用更具先锋性的星际靛蓝作为主色。

```css
--primary-50:  #f0f4ff   /* 最浅背景 */
--primary-100: #e0e8ff
--primary-200: #c7d4fe
--primary-300: #a4b8fc
--primary-400: #818cf8
--primary-500: #6366f1   /* ⭐ 主色 - 星际靛蓝 */
--primary-600: #4f46e5
--primary-700: #4338ca
--primary-800: #3730a3
--primary-900: #312e81   /* 最深 */
```

---

## 2. 强调色系 - 流光渐变色

六大强调色，来源于各大OS系统的"质感能量色"概念：

| 名称 | 色值 | 用途 |
|------|------|------|
| 科技青 | `#06b6d4` | 科技感元素、链接 |
| 梦幻紫 | `#8b5cf6` | 高亮、特殊状态 |
| 活力玫红 | `#f43f5e` | 警告、热门标签 |
| 能量琥珀 | `#f59e0b` | 提示、待处理 |
| 生机翠绿 | `#10b981` | 成功、完成状态 |
| 天际蓝 | `#0ea5e9` | 信息、链接悬停 |

---

## 3. 渐变系统

```css
/* 主渐变 - 星际流光 */
--gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);

/* 强调渐变 - 科技青紫 */
--gradient-accent: linear-gradient(135deg, #06b6d4 0%, #6366f1 100%);

/* 暖色渐变 - 活力玫红 */
--gradient-warm: linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%);

/* 冷色渐变 - 天际梦幻 */
--gradient-cool: linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%);

/* 英雄区渐变 - 多色流光 */
--gradient-hero: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f43f5e 100%);
```

---

## 4. 毛玻璃效果 (Glassmorphism)

```css
--glass-bg: rgba(255, 255, 255, 0.72);
--glass-border: rgba(255, 255, 255, 0.18);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
--glass-blur: blur(20px);
```

**应用场景**：
- 登录卡片
- 顶部导航栏
- 弹窗背景
- 浮动面板

---

## 5. 阴影系统

采用多层阴影，营造更自然的深度感：

```css
--shadow-xs:  0 1px 2px rgba(0,0,0,0.05);
--shadow-sm:  0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:  0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
--shadow-lg:  0 12px 24px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.04);
--shadow-xl:  0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06);
--shadow-2xl: 0 32px 64px rgba(0,0,0,0.14), 0 16px 32px rgba(0,0,0,0.08);

/* 品牌色发光 */
--shadow-glow: 0 0 40px rgba(99, 102, 241, 0.3);
--shadow-colored: 0 12px 24px rgba(99, 102, 241, 0.25);
```

---

## 6. 圆角系统

遵循 iOS/HarmonyOS 的大圆角设计语言：

```css
--radius-xs:   4px
--radius-sm:   6px
--radius-md:   8px
--radius-lg:   12px   /* 常用：按钮、输入框 */
--radius-xl:   16px   /* 常用：卡片 */
--radius-2xl:  20px   /* 弹窗 */
--radius-3xl:  24px   /* 大卡片、登录框 */
--radius-full: 9999px /* 胶囊形状 */
```

---

## 7. 动效系统

```css
/* 缓动曲线 */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);     /* 快出 */
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1); /* 自然过渡 */
--spring: cubic-bezier(0.34, 1.56, 0.64, 1);   /* 弹性效果 */

/* 时长 */
--duration-fast:   150ms  /* 微交互 */
--duration-normal: 250ms  /* 常规过渡 */
--duration-slow:   350ms  /* 复杂动画 */
```

---

## 8. 字体系统

优先使用系统原生字体，确保跨平台一致性：

```css
--font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 
               'SF Pro Text', 'Helvetica Neue', 'PingFang SC', 
               'Microsoft YaHei', sans-serif;

--font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

**字号规范**：

| 级别 | 大小 | 用途 |
|------|------|------|
| xs | 11px | 辅助文字、角标 |
| sm | 13px | 次要信息 |
| base | 14px | 正文 |
| md | 15px | 强调正文 |
| lg | 16px | 小标题 |
| xl | 18px | 标题 |
| 2xl | 20px | 页面标题 |
| 3xl | 24px | 大标题 |
| 4xl | 30px | 数据统计 |
| 5xl | 36px | 超大展示 |

---

## 9. 组件设计规范

### 按钮
- 默认高度：40px
- 大按钮：48px
- 小按钮：32px
- 主按钮使用渐变背景 + 品牌色阴影
- 悬停时轻微上浮 (translateY -1px)

### 输入框
- 圆角：12px
- 聚焦时显示主色光晕
- 前缀图标使用 gray-400

### 卡片
- 圆角：16px
- 边框：1px solid gray-200
- 悬停时边框变为主色，添加阴影

### 表格
- 表头背景：gray-50
- 行悬停背景：gray-50
- 分页器与表格视觉统一

### 标签
- 使用胶囊形状 (radius-full)
- 使用语义色的浅色背景 + 深色文字

---

## 10. 登录页设计

- 全屏渐变背景 + 极光动画
- 毛玻璃效果卡片
- 品牌色 Logo 图标
- 渐变文字标题

---

## 11. 侧边栏设计

- 深色渐变背景 (gray-800 → gray-900)
- Logo 区域带品牌色图标
- 菜单项使用全圆角
- 选中项使用渐变背景 + 阴影

---

## 12. 数据卡片设计

- 渐变图标背景
- 大号数字 (text-4xl)
- 底部描述带分割线
- 悬停时顶部显示渐变条

---

## 文件结构

```
src/styles/
├── theme.css          # CSS 变量定义
├── components.css     # 组件样式
└── antd-override.css  # Ant Design 覆盖样式
```

---

## 快速使用

所有样式已通过 CSS 变量暴露，可直接在 JSX 中使用：

```jsx
<div style={{ 
  background: 'var(--gradient-primary)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-lg)'
}}>
  ...
</div>
```

---

> **设计理念**：Less is More, 但 Premium 不能少。
