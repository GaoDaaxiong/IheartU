# IheratU PWA 使用说明

## 什么是PWA？
PWA（Progressive Web App）是一种可以像原生应用一样安装到设备上的网页应用。

## PWA功能
✅ 可以安装到手机/电脑桌面
✅ 离线访问（缓存所有资源）
✅ 全屏体验
✅ 快速加载

## 如何安装到手机桌面

### iOS (iPhone/iPad)
1. 使用Safari浏览器打开游戏网址
2. 点击底部的"分享"按钮
3. 向下滚动，选择"添加到主屏幕"
4. 点击"添加"

### Android
1. 使用Chrome浏览器打开游戏网址
2. 点击右上角菜单（三个点）
3. 选择"安装应用"或"添加到主屏幕"
4. 点击"安装"

### 桌面浏览器（Chrome/Edge）
1. 打开游戏网址
2. 地址栏右侧会出现"安装"图标
3. 点击安装即可

## 部署到GitHub Pages

1. 提交所有更改：
```bash
git add .
git commit -m "添加PWA支持"
git push origin main
```

2. 在GitHub仓库设置中启用GitHub Pages：
   - 进入仓库 Settings
   - 找到 Pages 选项
   - Source 选择 main 分支
   - 保存

3. 访问地址：
   https://gaodaaxiong.github.io/IheratU/

## 测试PWA功能

1. 在Chrome浏览器中打开开发者工具（F12）
2. 切换到"Application"标签
3. 查看：
   - Manifest：检查应用清单是否正确加载
   - Service Workers：检查是否注册成功
   - Cache Storage：查看缓存的资源

## 注意事项

- PWA需要HTTPS才能正常工作（GitHub Pages自动提供HTTPS）
- 首次访问时会缓存所有资源，可能需要一些时间
- 更新代码后，需要修改service-worker.js中的CACHE_NAME版本号（如v1改为v2）

## 文件说明

- `manifest.json`: 应用清单，定义应用名称、图标、主题色等
- `service-worker.js`: 服务工作线程，负责缓存和离线功能
- `index.html`: 已添加PWA相关meta标签和注册代码
