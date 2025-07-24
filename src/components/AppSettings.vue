<template>
  <n-modal v-model:show="show" preset="dialog" title="应用设置" style="width: 600px">
    <n-tabs v-model:value="activeTab" type="line" animated>
      <!-- 图床设置标签页 -->
      <n-tab-pane name="imagebed" tab="图床设置">
        <n-form :model="imageBedForm" label-placement="left" :label-width="100">
          <n-form-item label="图床类型">
            <n-select 
              v-model:value="imageBedForm.type" 
              :options="imageBedTypeOptions"
              @update:value="onImageBedTypeChange"
            />
          </n-form-item>
          
          <!-- 七牛云配置 -->
          <template v-if="imageBedForm.type === 'qiniu'">
            <n-form-item label="AccessKey">
              <n-input v-model:value="imageBedForm.config.qiniu_access_key" type="password" placeholder="七牛云AccessKey" />
            </n-form-item>
            <n-form-item label="SecretKey">
              <n-input v-model:value="imageBedForm.config.qiniu_secret_key" type="password" placeholder="七牛云SecretKey" />
            </n-form-item>
            <n-form-item label="Bucket">
              <n-input v-model:value="imageBedForm.config.qiniu_bucket" placeholder="存储空间名称" />
            </n-form-item>
            <n-form-item label="域名">
              <n-input v-model:value="imageBedForm.config.qiniu_domain" placeholder="your-domain.com" />
            </n-form-item>
            <n-form-item label="区域">
              <n-select v-model:value="imageBedForm.config.qiniu_region" :options="qiniuRegionOptions" />
            </n-form-item>
            <n-form-item label="路径前缀">
              <n-input v-model:value="imageBedForm.config.qiniu_path" placeholder="可选，如: book-covers" />
            </n-form-item>
            <n-form-item label="图片样式后缀">
              <n-input v-model:value="imageBedForm.config.qiniu_style_suffix" placeholder="可选，如: -pic 或 ?imageView2/1/w/500" />
            </n-form-item>
          </template>
          
          <!-- GitHub配置 -->
          <template v-if="imageBedForm.type === 'github'">
            <n-form-item label="Token">
              <n-input v-model:value="imageBedForm.config.github_token" type="password" placeholder="GitHub Personal Access Token" />
            </n-form-item>
            <n-form-item label="仓库">
              <n-input v-model:value="imageBedForm.config.github_repo" placeholder="username/repository" />
            </n-form-item>
            <n-form-item label="分支">
              <n-input v-model:value="imageBedForm.config.github_branch" placeholder="main" />
            </n-form-item>
            <n-form-item label="路径">
              <n-input v-model:value="imageBedForm.config.github_path" placeholder="可选，如: images" />
            </n-form-item>
          </template>
          
          <!-- 自定义图床配置 -->
          <template v-if="imageBedForm.type === 'custom'">
            <n-form-item label="上传URL">
              <n-input v-model:value="imageBedForm.config.custom_url" placeholder="自定义图床上传接口" />
            </n-form-item>
            <n-form-item label="Token">
              <n-input v-model:value="imageBedForm.config.custom_token" type="password" placeholder="可选" />
            </n-form-item>
          </template>
          
          <!-- 不使用图床时的说明 -->
          <template v-if="imageBedForm.type === 'none'">
            <n-form-item>
              <n-alert type="info" title="不使用图床">
                选择此选项后，您需要手动输入图片URL或使用其他方式管理图片。添加书籍时可以直接在封面字段中输入图片链接。
              </n-alert>
            </n-form-item>
          </template>
        </n-form>
      </n-tab-pane>
      
      <!-- 备份设置标签页 -->
      <n-tab-pane name="backup" tab="备份设置">
        <n-form :model="backupForm" label-placement="left" :label-width="120">
          
          <n-form-item label="备份文件夹路径">
            <n-input-group>
              <n-input 
                v-model:value="backupForm.folderPath" 
                placeholder="选择备份文件保存位置"
                readonly
              />
              <n-button @click="selectBackupFolderPath">
                选择文件夹
              </n-button>
            </n-input-group>
          </n-form-item>
          
          <n-form-item label="最大备份数量">
            <n-input-number 
              v-model:value="backupForm.maxBackups" 
              :min="1" 
              :max="50"
              placeholder="保留的备份文件数量"
            />
          </n-form-item>
          
          
          <n-form-item>
            <n-space>
              <n-button @click="viewBackupHistory" ghost>
                查看备份历史
              </n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </n-tab-pane>
      
      <!-- 通用设置标签页 -->
      <n-tab-pane name="general" tab="通用设置">
        <n-form :model="generalForm" label-placement="left" :label-width="120">
          <n-form-item label="默认视图模式">
            <n-select 
              v-model:value="generalForm.defaultViewMode" 
              :options="viewModeOptions"
            />
          </n-form-item>
          
          <n-form-item label="网格视图每页数量">
            <n-input-number 
              v-model:value="generalForm.gridViewPageSize" 
              :min="6" 
              :max="60"
              :step="6"
              placeholder="网格视图每页显示的书籍数量"
            />
          </n-form-item>
          
          <n-form-item label="表格视图每页数量">
            <n-input-number 
              v-model:value="generalForm.tableViewPageSize" 
              :min="5" 
              :max="100"
              :step="5"
              placeholder="表格视图每页显示的书籍数量"
            />
          </n-form-item>
          
          <n-form-item label="网格视图加载模式">
            <n-select 
              v-model:value="generalForm.gridLoadMode" 
              :options="gridLoadModeOptions"
            />
          </n-form-item>
          
          <n-form-item label="无限滚动每批数量" v-if="generalForm.gridLoadMode === 'infinite'">
            <n-input-number 
              v-model:value="generalForm.infiniteScrollBatchSize" 
              :min="6" 
              :max="48"
              :step="6"
              placeholder="每次滚动加载的书籍数量"
            />
          </n-form-item>
          
          <n-form-item label="启用虚拟滚动" v-if="generalForm.gridLoadMode === 'infinite'">
            <n-switch v-model:value="generalForm.enableVirtualScroll" />
            <n-text depth="3" style="margin-left: 8px; font-size: 12px;">
              当书籍数量较多时启用以提升性能
            </n-text>
          </n-form-item>
        </n-form>
      </n-tab-pane>
      
      <!-- 图书API设置标签页 -->
      <n-tab-pane name="bookapi" tab="图书API">
        <n-form :model="bookApiForm" label-placement="left" :label-width="120">
          <n-form-item>
            <n-alert type="info" title="关于图书API">
              本软件通过ISBN API实现自动获取书籍信息功能。您可以选择配置API Key来启用此功能，或继续使用手动录入方式。
            </n-alert>
          </n-form-item>
          
          <n-form-item label="API Key">
            <n-input 
              v-model:value="bookApiForm.apiKey" 
              type="password" 
              placeholder="可选：输入您的ISBN API Key"
            />
          </n-form-item>
          
          <n-form-item>
            <n-space>
              <n-button 
                @click="openIsbnApiWebsite" 
                type="primary"
                ghost
              >
                获取API Key
              </n-button>
              <n-button 
                @click="testIsbnApiKey" 
                :loading="testingIsbnApi"
                :disabled="!bookApiForm.apiKey"
                ghost
              >
                测试连接
              </n-button>
            </n-space>
          </n-form-item>
          
          <n-form-item>
            <n-text depth="3" style="font-size: 12px;">
              点击"获取API Key"将跳转到ISBN API官网，您可以在那里注册并获取API密钥。配置后可通过ISBN号自动获取书籍信息，未配置时仍可使用手动录入功能。
            </n-text>
          </n-form-item>
        </n-form>
      </n-tab-pane>
      
      <!-- 博客路径设置标签页 -->
      <n-tab-pane name="blog" tab="博客同步">
        <n-form :model="blogForm" label-placement="left" :label-width="120">
          <n-form-item>
            <n-alert type="info">
              <template #header>
                <n-icon size="16" style="margin-right: 6px;">
                  <InfoIcon />
                </n-icon>
                博客同步配置
              </template>
              <p style="margin: 8px 0; font-size: 13px; line-height: 1.5;">
                这里显示您在初次设置或清除缓存后选择的博客文件路径。版本检查和同步功能请在主界面使用。
              </p>
            </n-alert>
          </n-form-item>
          
          <n-form-item label="博客文件路径">
            <n-input-group>
              <n-input 
                v-model:value="blogForm.blogPath" 
                placeholder="选择您博客中的index.md文件"
                readonly
              />
              <n-button @click="selectBlogPath" :loading="selectingBlogPath">
                选择文件
              </n-button>
            </n-input-group>
          </n-form-item>
          
          <n-form-item v-if="blogForm.blogPath" label="文件状态">
            <n-space vertical size="small">
              <n-tag :type="blogStatus.exists ? 'success' : 'error'">
                {{ blogStatus.exists ? '文件存在' : '文件不存在' }}
              </n-tag>
              <n-text depth="3" style="font-size: 12px;">
                最后同步：{{ blogStatus.lastSync ? formatTime(blogStatus.lastSync) : '从未同步' }}
              </n-text>
            </n-space>
          </n-form-item>
          
          <n-form-item v-if="!blogForm.blogPath">
            <n-alert type="warning">
              <template #header>
                未配置博客路径
              </template>
              <p style="margin: 8px 0; font-size: 13px; line-height: 1.5;">
                请选择您博客中的index.md文件，或使用主界面的"清除缓存"功能重新进行初次设置。
              </p>
            </n-alert>
          </n-form-item>
        </n-form>
      </n-tab-pane>
    </n-tabs>
    
    <template #action>
      <n-space>
        <n-button @click="resetSettings" ghost>重置</n-button>
        <n-button @click="show = false">取消</n-button>
        <n-button type="primary" @click="saveSettings">保存设置</n-button>
      </n-space>
    </template>
  </n-modal>
  
  <!-- 备份历史查看器 -->
  <n-modal v-model:show="showBackupHistory" preset="dialog" title="备份历史" style="width: 800px">
    <n-data-table
      :columns="backupHistoryColumns"
      :data="backupHistoryData"
      :pagination="{ pageSize: 10 }"
      max-height="400"
    />
    <template #action>
      <n-button @click="showBackupHistory = false">关闭</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { type ImageBedConfig, ImageBedType } from '../utils/imageBed'
import { getBackupHistory, type BackupInfo } from '../utils/backup'
import { versionSyncManager } from '../utils/versionSync'
import { parseExistingBooks } from '../utils/bookParser'
import { configAPI } from '../utils/configAPI'
import { type IsbnApiConfig } from '../types'
import type { AppSettings as AppSettingsType } from '../types/config'

interface Props {
  imageBedConfig: ImageBedConfig
}

interface AppSettings {
  imageBed: ImageBedConfig
  backup: {
    folderPath: string
    maxBackups: number
  }
  general: {
    defaultViewMode: 'grid' | 'table'
    gridViewPageSize: number
    tableViewPageSize: number
    gridLoadMode: 'pagination' | 'infinite'
    infiniteScrollBatchSize: number
    enableVirtualScroll: boolean
  }
  bookApi: {
    apiKey: string
  }
  blog: {
    blogPath: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updateImageBedConfig: [config: ImageBedConfig]
  updateIsbnApiConfig: [config: IsbnApiConfig]
  updateSettings: [settings: AppSettings]
}>()

const message = useMessage()
const show = defineModel<boolean>('show', { default: false })

// 活动标签页
const activeTab = ref('imagebed')

// 图床设置表单
const imageBedForm = reactive<{
  type: string
  config: Record<string, any>
}>({
  type: props.imageBedConfig.type,
  config: { ...props.imageBedConfig.config }
})

// 备份设置表单
const backupForm = reactive({
  folderPath: '',
  maxBackups: 10
})

// 通用设置表单
const generalForm = reactive({
  defaultViewMode: 'grid' as 'grid' | 'table',
  gridViewPageSize: 12,
  tableViewPageSize: 10,
  gridLoadMode: 'pagination' as 'pagination' | 'infinite',
  infiniteScrollBatchSize: 12,
  enableVirtualScroll: false
})

// 图书API设置表单
const bookApiForm = reactive({
  apiKey: ''
})

// 博客设置表单
const blogForm = reactive({
  blogPath: ''
})

// 状态变量
const selectingBlogPath = ref(false)
const blogStatus = reactive({
  exists: false,
  lastSync: 0
})

// 组件挂载时初始化设置
onMounted(async () => {
  // 初始化配置API
  await configAPI.initialize()
  
  // 加载现有设置
  await initializeSettings()
})

// InfoIcon 组件
const InfoIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
  })
])

// 图床类型选项
const imageBedTypeOptions = [
  { label: '不使用图床', value: 'none' },
  { label: '七牛云', value: 'qiniu' },
  { label: 'GitHub', value: 'github' },
  { label: '自定义', value: 'custom' },
  { label: 'SM.MS', value: 'sm.ms' },
  { label: 'ImgBB', value: 'imgbb' },
  { label: 'Imgur', value: 'imgur' }
]

// 七牛云区域选项
const qiniuRegionOptions = [
  { label: '华东 (z0)', value: 'z0' },
  { label: '华北 (z1)', value: 'z1' },
  { label: '华南 (z2)', value: 'z2' },
  { label: '北美 (na0)', value: 'na0' },
  { label: '东南亚 (as0)', value: 'as0' }
]

// 视图模式选项
const viewModeOptions = [
  { label: '网格视图', value: 'grid' },
  { label: '表格视图', value: 'table' }
]

// 网格加载模式选项
const gridLoadModeOptions = [
  { label: '分页模式', value: 'pagination' },
  { label: '无限滚动', value: 'infinite' }
]

// 监听props变化
watch(() => props.imageBedConfig, (newConfig) => {
  imageBedForm.type = newConfig.type
  imageBedForm.config = { ...newConfig.config }
}, { deep: true })

// 监听对话框显示状态
watch(show, (newShow) => {
  if (newShow) {
    // 对话框打开时，重新加载最新设置
    initializeSettings()
  }
})

// 图床类型切换
const onImageBedTypeChange = (value: string) => {
  imageBedForm.config = {}
  
  if (value === 'none') {
    // 不使用图床时，清空所有配置
    imageBedForm.config = {}
  } else if (value === 'qiniu') {
    imageBedForm.config = {
      qiniu_access_key: '',
      qiniu_secret_key: '',
      qiniu_bucket: '',
      qiniu_domain: '',
      qiniu_region: 'z0',
      qiniu_path: 'book-covers',
      qiniu_style_suffix: ''
    }
  } else if (value === 'github') {
    imageBedForm.config = {
      github_token: '',
      github_repo: '',
      github_branch: 'main',
      github_path: 'images'
    }
  } else if (value === 'custom') {
    imageBedForm.config = {
      custom_url: '',
      custom_token: ''
    }
  }
}

// 测试ISBN API
const testingIsbnApi = ref(false)
// 打开ISBN API官网
const openIsbnApiWebsite = () => {
  window.open('https://market.isbn.work/#/home', '_blank')
}

// 测试ISBN API Key
const testIsbnApiKey = async () => {
  if (!bookApiForm.apiKey) {
    message.error('请先输入API Key')
    return
  }
  
  testingIsbnApi.value = true
  try {
    // 导入getBookByISBN函数进行测试
    const { getBookByISBN } = await import('../utils/doubanAPI')
    
    // 使用一个已知的ISBN进行测试
    const testIsbn = '9787115563989' // 测试用的ISBN
    const result = await getBookByISBN(testIsbn, { apiKey: bookApiForm.apiKey })
    
    if (result) {
      message.success('API Key测试成功！')
    } else {
      message.error('API Key测试失败：未返回书籍信息')
    }
  } catch (error) {
    console.error('API Key测试失败:', error)
    message.error(`API Key测试失败: ${error.message}`)
  } finally {
    testingIsbnApi.value = false
  }
}

// 选择备份文件夹
const selectBackupFolderPath = async () => {
  if (window.electronAPI && window.electronAPI.selectBackupFolder) {
    try {
      const result = await window.electronAPI.selectBackupFolder()
      if (result.success && result.data) {
        backupForm.folderPath = result.data.folderPath
        message.success('文件夹选择成功')
      } else if (result.error && !result.error.includes('用户取消')) {
        message.error('选择文件夹失败: ' + result.error)
      }
    } catch (error) {
      console.error('调用selectBackupFolder出错:', error)
      message.error('调用文件夹选择失败')
    }
  } else {
    message.error('当前环境不支持文件夹选择功能')
  }
}


// 备份历史相关
const showBackupHistory = ref(false)
const backupHistoryData = ref<BackupInfo[]>([])

const backupHistoryColumns = [
  {
    title: '原文件',
    key: 'original_path',
    ellipsis: { tooltip: true },
    render: (row: BackupInfo) => {
      const fileName = row.original_path.split('/').pop() || row.original_path
      return h('span', { title: row.original_path }, fileName)
    }
  },
  {
    title: '备份文件',
    key: 'backup_path',
    ellipsis: { tooltip: true },
    render: (row: BackupInfo) => {
      const fileName = row.backup_path.split('/').pop() || row.backup_path
      return h('span', { title: row.backup_path }, fileName)
    }
  },
  {
    title: '备份时间',
    key: 'timestamp',
    render: (row: BackupInfo) => new Date(row.timestamp).toLocaleString()
  },
  {
    title: '大小',
    key: 'size',
    render: (row: BackupInfo) => `${(row.size / 1024).toFixed(2)} KB`
  },
  {
    title: '操作',
    key: 'actions',
    render: (row: BackupInfo) => {
      return h('n-button', {
        size: 'small',
        type: 'primary',
        ghost: true,
        onClick: () => openBackupInFolder(row.backup_path)
      }, '打开文件夹')
    }
  }
]

const viewBackupHistory = () => {
  try {
    backupHistoryData.value = getBackupHistory()
    showBackupHistory.value = true
  } catch (error) {
    message.error('获取备份历史失败')
    console.error('获取备份历史错误:', error)
  }
}

// 在文件夹中打开备份文件
const openBackupInFolder = async (backupPath: string) => {
  try {
    if (window.electronAPI && window.electronAPI.openInFolder) {
      const result = await window.electronAPI.openInFolder(backupPath)
      if (result.success) {
        message.success('已在文件夹中打开备份文件')
      } else {
        message.error(`打开文件夹失败: ${result.error}`)
      }
    } else {
      message.error('当前环境不支持打开文件夹功能')
    }
  } catch (error) {
    console.error('打开文件夹失败:', error)
    message.error('打开文件夹失败')
  }
}

// 博客路径相关方法
const selectBlogPath = async () => {
  try {
    if (window.electronAPI && window.electronAPI.selectMdFile) {
      selectingBlogPath.value = true
      const result = await window.electronAPI.selectMdFile()
      
      if (result.success && result.data) {
        const { content, fileName, filePath } = result.data
        
        // 验证文件内容 - 确保是有效的博客文件
        try {
          const parseResult = parseExistingBooks(content)
          if (parseResult.books.length === 0) {
            message.warning('选择的文件中没有找到书籍数据，请确认这是正确的博客文件')
            return
          }
        } catch (error) {
          message.error('文件格式不正确，无法解析为书籍数据')
          return
        }
        
        // 仅设置博客路径，不处理数据同步
        blogForm.blogPath = filePath
        await versionSyncManager.setBlogPath(filePath)
        await updateBlogStatus()
        
        message.success(`博客文件路径设置成功: ${fileName}`)
        message.info('请回到主界面使用"版本检查"功能进行数据同步')
      }
    } else {
      message.error('当前环境不支持文件选择')
    }
  } catch (error) {
    console.error('选择博客文件失败:', error)
    message.error('选择博客文件失败')
  } finally {
    selectingBlogPath.value = false
  }
}

const updateBlogStatus = async () => {
  if (!blogForm.blogPath) return
  
  try {
    const result = await window.electronAPI?.fileExists(blogForm.blogPath)
    if (result?.success) {
      blogStatus.exists = result.data || false
    }
  } catch (error) {
    console.error('检查文件状态失败:', error)
  }
}

const formatTime = (timestamp: number): string => {
  if (!timestamp) return '从未同步'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 保存设置
const saveSettings = async () => {
  try {
    // 保存旧的视图模式以检测变化
    const oldSettings = await configAPI.getSettings()
    const oldViewMode = oldSettings?.general?.defaultViewMode
    
    // 验证图床配置（只有在选择了具体图床类型且填写了部分配置时才验证）
    if (imageBedForm.type === 'qiniu' && imageBedForm.config.qiniu_access_key && 
        (!imageBedForm.config.qiniu_secret_key || !imageBedForm.config.qiniu_bucket)) {
      message.error('请完整填写七牛云配置：AccessKey、SecretKey和Bucket名称')
      return
    }
    
    if (imageBedForm.type === 'github' && imageBedForm.config.github_token && 
        !imageBedForm.config.github_repo) {
      message.error('请完整填写GitHub配置：Token和仓库名称')
      return
    }
    
    // 保存图床配置
    const newImageBedConfig: ImageBedConfig = {
      type: imageBedForm.type as ImageBedType,
      config: { ...imageBedForm.config }
    }
    
    emit('updateImageBedConfig', newImageBedConfig)
    
    // 发出ISBN API配置更新事件
    const newIsbnApiConfig: IsbnApiConfig = { ...bookApiForm }
    emit('updateIsbnApiConfig', newIsbnApiConfig)
    
    // 保存完整设置（移除博客路径，由versionSyncManager单独管理）
    const settings: AppSettingsType = {
      imageBed: newImageBedConfig,
      backup: { ...backupForm },
      general: { ...generalForm },
      bookApi: { ...bookApiForm },
      blog: { blogPath: '' } // 博客路径由versionSyncManager管理，这里置空避免冲突
    }
    
    emit('updateSettings', settings)
    
    // 使用configAPI保存设置
    const saveSuccess = await configAPI.saveSettings(settings)
    
    if (saveSuccess) {
      message.success('设置已保存')
      
      // 检测视图模式是否变化
      if (oldViewMode && oldViewMode !== generalForm.defaultViewMode) {
        message.info('默认视图模式已更改，将在下次启动应用时生效')
      }
      
      show.value = false
    } else {
      message.error('保存设置失败')
    }
  } catch (error) {
    message.error('保存设置失败')
    console.error(error)
  }
}

// 重置设置
const resetSettings = () => {
  // 重置图床设置
  imageBedForm.type = 'none'
  onImageBedTypeChange('none')
  
  // 重置备份设置
  Object.assign(backupForm, {
    folderPath: '',
    maxBackups: 10
  })
  
  // 重置通用设置
  Object.assign(generalForm, {
    defaultViewMode: 'grid',
    gridViewPageSize: 12,
    tableViewPageSize: 10,
    gridLoadMode: 'pagination',
    infiniteScrollBatchSize: 12,
    enableVirtualScroll: false
  })
  
  // 重置图书API设置
  Object.assign(bookApiForm, {
    apiKey: ''
  })
  
  // 重置博客设置（博客路径由versionSyncManager管理，不在此重置）
  // Object.assign(blogForm, {
  //   blogPath: ''
  // })
  // 注意：博客路径由versionSyncManager单独管理，如需重置请使用主界面的"清除缓存"功能
  
  message.info('设置已重置')
}

// 初始化设置
const initializeSettings = async () => {
  try {
    const savedSettings = await configAPI.getSettings()
    if (savedSettings) {
      // 恢复备份设置
      if (savedSettings.backup) {
        Object.assign(backupForm, savedSettings.backup)
      }
      
      // 恢复通用设置
      if (savedSettings.general) {
        Object.assign(generalForm, savedSettings.general)
      }
      
      // 恢复图书API设置
      if (savedSettings.bookApi) {
        Object.assign(bookApiForm, savedSettings.bookApi)
      }
      
      // 恢复博客设置（博客路径由versionSyncManager管理，不从settings中读取）
      // if (savedSettings.blog) {
      //   Object.assign(blogForm, savedSettings.blog)
      // }
    }
    
    // 从版本同步管理器获取博客配置并覆盖本地设置
    const blogConfig = await versionSyncManager.getBlogConfig()
    if (blogConfig) {
      blogForm.blogPath = blogConfig.blogPath
      blogStatus.lastSync = blogConfig.lastSyncTime
      updateBlogStatus()
    }
  } catch (error) {
    console.error('初始化设置失败:', error)
  }
}
</script>

<style scoped>
.n-form-item {
  margin-bottom: 16px;
}

.n-input-group .n-button {
  border-left: none;
}
</style>