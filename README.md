# 书籍管理工具

一个基于 Electron 的本地图形化工具，用于管理 Hexo 博客的书单页面，支持自动获取书籍信息和图床上传。

预览：[Incodes blog](https://inkcodes.com/books/)
使用本工具可以很方便地管理书籍、包括添加、删除、排序等，目前仅支持七牛云图床上传书籍封面，主要实现依赖：[PicGo-Core](https://github.com/PicGo/PicGo-Core)、[ISBN API](https://market.isbn.work/#/home)，
<img width="1279" height="1547" alt="图片" src="https://github.com/user-attachments/assets/abcb5d2e-83b1-429a-b657-425ddd288f0a" />

## 功能特性

### 🚀 功能
- **书籍信息获取**: 支持 ISBN 查询自动获取书籍信息，也支持手动录入
- **图床上传**: 集成 PicGo 支持多种图床服务（目前仅七牛云），获取到的封面图片一键上传至自己的七牛云图床，防止今后资源失效。
- **版本管理**: 自动备份文件，支持恢复和基于书本增、删、字段（书名、链接等）修改的版本检测，确保所见界面即网页界面。
- **跨平台支持**: 支持 Windows、macOS、Linux 桌面应用

### 🎨 界面特性
- **现代化界面**: 使用 Naive UI 组件库，支持深色/浅色主题
- **响应式设计**: 适配不同屏幕尺寸，当宽屏时，网格模式每行书籍数量变化。
- **实时预览**: 支持实时预览生成的 HTML 效果

## 技术架构

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite（支持 web/electron 双模式）
- **UI 库**: Naive UI
- **状态管理**: Composition API

## 使用方法

### 在release中下载对应的版本安装后运行
#### 1.申请图书API key
- [ISBN API](https://market.isbn.work/#/home),其免费提供100次api，如付费，每年3000次足够使用
- 在软件设置中填入api

#### 2.获取七牛云密钥
- 在七牛云控制台中，获取个人密钥AccessKey/SecretKey
- 在软件设置中填入密钥、Bucket等信息
  
#### 3. 添加书籍
1. 点击"添加书籍"按钮
2. 选择输入方式（ISBN 查询或手动输入）
3. 输入 ISBN 码并点击"获取信息"（需要先配置 API Key）
4. 应用会自动获取图书API的图片链接并上传至个人图床
5. 完善书籍信息（下载链接、提取码、个人评价等）
6. 点击"保存"

#### 4. 管理书籍
- **编辑**: 点击书籍列表中的"编辑"按钮
  - 链接、书名、作者等，还包括编辑md文件的html头尾部分（hexo Front Matter数据，尾部的js、自定义css代码等）
- **删除**: 点击书籍列表中的"删除"按钮
- **刷新**: 点击"刷新"按钮重新加载数据
- **排序**: 在网格视图或表格视图中直接拖拽

上述操作发生变化后“版本检查”按钮可以校验应用缓存的数据与博客目录内的`index.md`版本是否一致，可选择使用缓存覆盖博客文件或逆向覆盖，总之，经过确认才会使博客版本发生变化。

#### 5. 生成HTML
1. 推荐直接使用“版本检查”根据提示选择覆盖方向
2. 点击生成新的 `index.md` 文件，手动保存到文件夹，手动替换书单目录文件

### 自行构建→下载源码后按以下方式进行构建
```bash
# 安装依赖
npm install

# Web 开发模式（浏览器访问）
npm run dev

# Electron 开发模式（桌面应用）
npm run electron:dev

# 构建 Electron 组件
npm run build:electron

# 构建并打包桌面应用
npm run build

```


## 项目结构

```
book-manager/
├── src/
│   ├── components/           # Vue 组件
│   │   ├── BookManager.vue   # 主管理界面（核心书籍管理功能）
│   │   ├── BookCard.vue      # 书籍卡片组件
│   │   ├── AddBookForm.vue   # 添加书籍表单
│   │   ├── EditBookForm.vue  # 编辑书籍表单
│   │   ├── AppMain.vue       # 主应用容器
│   │   ├── AppContent.vue    # 内容容器
│   │   ├── AppSettings.vue   # 设置界面
│   │   ├── FirstTimeSetup.vue # 首次设置向导
│   │   ├── VersionCheckControl.vue # 版本检查控件
│   │   ├── VersionConflictDialog.vue # 版本冲突对话框
│   │   └── Icons.ts          # 图标组件
│   ├── composables/          # Vue 3 组合式函数（业务逻辑复用）
│   │   ├── useVersionCheck.ts # 版本检查逻辑
│   │   └── useFirstTimeSetup.ts # 首次设置逻辑
│   ├── config/               # 配置文件
│   │   └── sampleData.ts     # 示例数据
│   ├── types/                # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/                # 工具函数
│   │   ├── bookParser.ts     # HTML 解析和生成
│   │   ├── doubanAPI.ts      # ISBN API接口
│   │   ├── imageBed.ts       # 图床上传服务
│   │   ├── backup.ts         # 文件备份系统
│   │   ├── browserAPI.ts     # 本地存储和文件操作
│   │   ├── errorLogger.ts    # 错误日志系统
│   │   ├── themeConfig.ts    # 主题配置
│   │   └── versionSync.ts    # 版本同步工具
│   ├── App.vue               # 根组件
│   └── main.ts               # 入口文件
├── electron/                 # Electron 主进程代码
│   ├── main.ts               # Electron 主进程
│   ├── preload.ts            # 预加载脚本
│   ├── picgo-service.ts      # PicGo 服务集成
│   └── tsconfig.json         # Electron TypeScript 配置
├── scripts/                  # 构建脚本
│   └── build-cjs.cjs         # 模块格式转换脚本
├── dist-electron/            # 构建后的 Electron 文件 (.cjs)
├── dist/                     # 构建后的前端文件
├── public/                   # 静态资源
├── release/                  # 构建发布文件
├── temp/                     # 临时文件目录
├── package.json
├── vite.config.ts
└── tsconfig.json
```


## 生成的HTML格式

生成的HTML完全兼容现有的CSS样式：

```html
<li>
  <div class="info">
    <a href="豆瓣链接" target="_blank" rel="noopener noreferrer" class="book-container">
      <div class="book" title="书名">
        <img src="封面图片" alt="书名">
      </div>
    </a>
    <div class="info-card">
      <div class="hidden-content">
        <p class="text">个人评价</p>
      </div>
      <h3>《书名》</h3>
      <p>作者：作者名</p>
      <p>出版时间：出版日期</p>
      <p>
        <a href="下载链接" target="_blank" rel="noopener noreferrer">📥 下载</a>
      </p>
      <p class="pwd-text">
        提取码：提取码
      </p>
    </div>
  </div>
</li>
```

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个工具。

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- Email: haochun1588@gmail.com
- Telegram: @ifyoulike
