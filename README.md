# # 🎂 IheartU - 生日快乐互动小游戏

一个温馨的生日祝福互动小游戏，通过解谜闯关的方式，让玩家走出"HBD💗U"的轨迹，最后呈现生日祝福。

## 🎮 在线体验

**网页版：** [https://gaodaaxiong.github.io/IheartU/](https://gaodaaxiong.github.io/IheartU/)

**PWA版：** 支持安装到手机桌面，离线使用

## ✨ 特性

- 🎯 **5个精心设计的关卡** - 分别对应 H、B、D、💗、U 字母
- 🎨 **简洁优雅的设计** - 黑白配色，专注游戏体验
- 📱 **完美移动端适配** - 支持触摸操作，虚拟方向键
- 🔊 **沉浸式音效** - 背景音乐、脚步声、开门音效
- ⏱️ **倒计时挑战** - 每关都有时间限制，增加紧张感
- 🎬 **精彩回放系统** - 通关后自动回放你的行走轨迹
- 📦 **PWA支持** - 可安装到桌面，离线使用
- 🎵 **爵士乐配乐** - 回放时的浪漫背景音乐

## 🎯 游戏玩法

### 目标
在每个关卡中：
1. 收集钥匙（按顺序收集）
2. 避开障碍物
3. 在倒计时结束前到达门口
4. 走出特定字母的轨迹

### 操作方式

**桌面端：**
- ⬆️⬇️⬅️➡️ 方向键控制移动

**移动端：**
- 屏幕下方的虚拟方向键
- 支持触摸操作

### 关卡设计

1. **关卡1 (H)** - 学习基础操作
2. **关卡2 (B)** - 绕过圆形障碍物
3. **关卡3 (D)** - 顺序收集3把钥匙
4. **关卡4 (💗)** - 走出心形轨迹
5. **关卡5 (U)** - 最终挑战

## 📱 PWA安装指南

### iOS (iPhone/iPad)
1. 使用 **Safari** 浏览器打开游戏
2. 点击底部的 **分享** 按钮
3. 向下滚动，选择 **"添加到主屏幕"**
4. 点击 **"添加"**

### Android
1. 使用 **Chrome** 浏览器打开游戏
2. 点击右上角菜单（三个点）
3. 选择 **"安装应用"** 或 **"添加到主屏幕"**
4. 点击 **"安装"**

### 桌面浏览器
1. 打开游戏网址
2. 地址栏右侧会出现 **"安装"** 图标
3. 点击安装即可

## 🛠️ 技术栈

- **原生JavaScript** - 无框架依赖
- **Canvas API** - 游戏渲染
- **SoundJS** - 音频管理
- **Service Worker** - PWA离线支持
- **Web App Manifest** - 应用清单

## 📂 项目结构

```
IheartU/
├── index.html              # 主页面
├── manifest.json           # PWA应用清单
├── service-worker.js       # Service Worker
├── css/
│   └── index.css          # 样式文件
├── js/
│   ├── game.js            # 游戏核心逻辑
│   ├── Key.js             # 键盘控制
│   ├── mobile.js          # 移动端适配
│   ├── popup.js           # 弹窗功能
│   └── soundjs-0.6.0.min.js  # 音频库
├── assets/                # 图片资源
│   ├── clock.png
│   ├── door.png
│   ├── key.png
│   └── peep.png
├── audio/                 # 音频资源
│   ├── ding.mp3/ogg
│   ├── error.mp3/ogg
│   ├── jazz.mp3/ogg
│   ├── rewind.mp3/ogg
│   ├── step.mp3/ogg
│   └── unlock.mp3/ogg
└── icons/                 # 社交分享图标
```

## 🎨 核心功能实现

### 1. 障碍物系统
- **圆形障碍物** - 传统碰撞检测
- **弧形障碍物** - 引导玩家走出特定路径
- **直线障碍物** - 限制移动区域

### 2. 钥匙收集机制
- 支持顺序收集（sequentialKeys）
- 收集后自动显示下一把钥匙
- 所有钥匙收集后门才会打开

### 3. 倒计时系统
- 每关独立倒计时
- 时间用完自动重置关卡
- 时钟动画实时显示

### 4. 回放系统
- 记录玩家每一帧的位置
- 倒带效果（3倍速）
- 正向回放显示完整轨迹
- 配合爵士乐营造氛围

### 5. 移动端适配
- 虚拟方向键
- 横竖屏自动切换
- 触摸事件优化

## 🚀 本地开发

### 克隆项目
```bash
git clone https://github.com/GaoDaaxiong/IheartU.git
cd IheartU
```

### 启动本地服务器
```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx http-server -p 8000
```

### 访问
打开浏览器访问 `http://localhost:8000`

## 📝 自定义配置

### 修改关卡配置
编辑 `js/game.js` 中的 `LEVEL_CONFIG` 数组：

```javascript
{
  canvasId: "canvas_1",
  sequentialKeys: true,
  player: { x: 50, y: 350 },
  door: { x: 260, y: 270 },
  keys: [
    { x: 50, y: 50 },
    { x: 260, y: 50, visible: false }
  ],
  circles: [
    { x: 150, y: 50, radius: 90 }
  ],
  arcs: [
    { cx: 50, cy: 200, radius: 80, startAngle: Math.PI * 0.5, endAngle: Math.PI * 1.5 }
  ],
  lines: [
    { x1: 100, y1: 150, x2: 200, y2: 150 }
  ],
  countdown: 300
}
```

### 修改祝福语
编辑 `js/game.js` 中的 `iHeartYou()` 函数：

```javascript
vtext.textContent = "你的祝福语";
```

### 调整音效音量
在 `js/game.js` 中搜索 `createjs.Sound.play` 并调整 `volume` 参数。

## 🎵 音效说明

- **ding.mp3** - 进门音效
- **unlock.mp3** - 收集钥匙音效
- **step.mp3** - 脚步声
- **error.mp3** - 倒计时结束音效
- **rewind.mp3** - 倒带音效
- **jazz.mp3** - 回放背景音乐

## 🐛 已知问题

- iOS Safari 首次访问可能需要手动点击才能播放音频（浏览器限制）
- 部分Android设备的虚拟按键可能需要调整位置

## 📄 开源协议

本项目基于原项目 [it's a(door)able](http://ncase.me/door/) 进行修改和扩展。

## 🙏 致谢

- 原始游戏创意来自 Nicky Case
- 音频库使用 SoundJS
- 感谢所有贡献者

## 📮 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。

---

**Made with ❤️ for someone special**

🎂 Happy Birthday! 🎉