# 数据一致性修复 - 方案A实施记录

## 问题描述

版本冲突对话框显示的书籍数量与界面实际数据不一致，原因是存在双重存储系统：
- BookManager组件直接使用localStorage
- 版本比较系统使用configAPI（Electron环境下从文件系统读取）

## 解决方案

采用方案A：统一使用configAPI作为唯一数据源

## 修改内容

### 1. BookManager组件 (`src/components/BookManager.vue`)

- **导入configAPI**
  ```typescript
  import { configAPI } from '../utils/configAPI'
  ```

- **loadBooks函数**
  - 从 `storage.load()` 改为 `configAPI.getBooksData()`
  - 数据恢复后使用 `configAPI.saveBooksData()`

- **saveBooks函数**
  - 从同步的 `storage.save()` 改为异步的 `configAPI.saveBooksData()`
  - 保存完整的数据结构（books、originalFileOrder、originalFileStructure、currentFile）

- **onMounted钩子**
  - 添加 `await configAPI.initialize()` 初始化
  - 从 `storage.load('appSettings')` 改为 `await configAPI.getSettings()`

- **其他修改**
  - refreshSettings：使用 `configAPI.getSettings()`
  - clearAllCache：使用 `configAPI.saveBooksData()` 清空数据
  - resetSortOrder：使用 `configAPI.getBooksData()` 获取文件结构
  - loadFromFile：使用 `configAPI.saveBooksData()` 保存数据

### 2. useFirstTimeSetup组合式函数 (`src/composables/useFirstTimeSetup.ts`)

- **导入configAPI**
  ```typescript
  import { configAPI } from '../utils/configAPI'
  ```

- **checkIfFirstTimeUser函数**
  - 改为异步函数
  - 使用 `configAPI.getAppState()` 替代 `storage.load()`

- **handleFirstTimeSetupCompleted函数**
  - 使用 `configAPI.getAppState()` 和 `configAPI.saveAppState()`
  - 所有书籍数据保存使用 `configAPI.saveBooksData()`
  - 移除所有直接的localStorage操作

## 优势

1. **数据一致性**：所有组件使用同一数据源，避免不同步问题
2. **跨平台支持**：configAPI自动处理Electron和Web环境的差异
3. **自动备份**：Electron环境下支持文件系统级别的备份
4. **更好的错误处理**：统一的API调用和错误处理机制

## 注意事项

1. 所有数据操作现在都是**异步**的，需要使用 `await`
2. 初始化时必须先调用 `configAPI.initialize()`
3. configAPI会自动从localStorage迁移旧数据到文件系统（仅在首次运行时）

## 测试要点

1. 新增/删除书籍后，版本冲突对话框应显示正确的书籍数量
2. 数据应该正确保存到文件系统（Electron）或localStorage（Web）
3. 应用重启后数据应该正确加载
4. 版本同步功能应该正常工作