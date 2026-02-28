# 银临Wiki 设计方案

## 设计目标
忠实复刻 yinlin.wiki，保留原站的清新国风美学风格。

<response>
<idea>
**Design Movement**: 现代国风水墨美学（Contemporary Ink-Wash Aesthetics）

**Core Principles**:
1. 清透水墨背景 - 以淡蓝灰色调的山水背景贯穿全站，营造空灵意境
2. 轻盈卡片系统 - 半透明白色卡片，带有柔和阴影，悬浮于背景之上
3. 精致排版层次 - 标题使用思源宋体，正文使用思源黑体，保持阅读舒适性
4. 功能优先设计 - 左侧筛选面板 + 右侧内容区的经典布局

**Color Philosophy**:
- 主色：天青蓝 #4A90D9 / 淡蓝 #B8D4E8
- 背景：冰雪白 #EFF6FB 渐变到 #D4E9F7
- 文字：深墨 #2C3E50 / 中灰 #6B7C93
- 强调：朱砂红 #E74C3C（用于活跃状态）

**Layout Paradigm**:
- 顶部导航栏：固定，带logo和导航菜单
- 左侧筛选面板：固定宽度180px，半透明背景
- 右侧内容区：无限滚动加载
- 背景：全屏水墨山水图

**Signature Elements**:
1. 水墨山水全屏背景（根据页面切换不同背景）
2. 半透明毛玻璃卡片效果
3. 银临logo的书法风格字体

**Interaction Philosophy**:
- 平滑的页面切换动画
- 卡片悬停时轻微上浮效果
- 筛选标签点击时的水波纹效果

**Animation**:
- 页面进入：fade-in + slide-up (300ms ease-out)
- 卡片悬停：translateY(-2px) + box-shadow增强 (200ms)
- 加载更多：渐入动画

**Typography System**:
- 标题：Noto Serif SC（思源宋体）
- 正文：Noto Sans SC（思源黑体）
- 导航：14px medium weight
- 卡片标题：16px semibold
</idea>
<probability>0.08</probability>
</response>

## 选择方案
选择方案一：现代国风水墨美学，忠实还原原站的清新淡雅风格。
