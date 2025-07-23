<template>
  <div>
    <n-space vertical size="large">
      <!-- 状态提示框 -->
      <div class="status-alert-container">
        <!-- 博客目录模式 -->
        <n-alert 
          v-if="isBlogMode" 
          type="success" 
          :show-icon="false"
          class="blog-directory-alert"
        >
          <template #header>
            <div class="alert-header">
              <n-icon class="alert-icon" size="18">
                <FolderIcon />
              </n-icon>
              <span class="alert-title">博客目录</span>
            </div>
          </template>
          <div class="alert-content">
            <div class="file-info">
              <div class="file-name">
                <n-icon class="info-icon" size="16">
                  <SaveIcon />
                </n-icon>
                <span class="file-name-text">{{ currentFile.fileName }}</span>
              </div>
              <div class="file-path">
                <n-icon class="info-icon" size="16">
                  <LinkIcon />
                </n-icon>
                <span class="file-path-text" :title="currentFile.filePath">
                  {{ formatPath(currentFile.filePath) }}
                </span>
                <n-button
                  size="tiny"
                  quaternary
                  @click="copyPathToClipboard(currentFile.filePath)"
                  class="copy-button"
                >
                  <template #icon>
                    <n-icon size="14">
                      <CopyIcon />
                    </n-icon>
                  </template>
                </n-button>
              </div>
            </div>
            <div class="operation-tip">
              <n-icon class="tip-icon" size="16">
                <SyncIcon />
              </n-icon>
              <span>点击"版本检查"按钮进行博客md文件同步</span>
            </div>
          </div>
        </n-alert>

        <!-- 示例数据模式 -->
        <n-alert 
          v-else
          type="warning"
          :show-icon="false"
          class="example-data-alert"
        >
          <template #header>
            <div class="alert-header">
              <n-icon class="alert-icon" size="18">
                <DatabaseIcon />
              </n-icon>
              <span class="alert-title">使用示例数据</span>
            </div>
          </template>
          <div class="alert-content">
            <div class="current-status">
              <p>当前正在使用示例数据进行演示</p>
            </div>
            <div class="operation-tips">
              <div class="tip-item">
                <n-icon class="tip-icon" size="16">
                  <SaveIcon />
                </n-icon>
                <span>使用"另存或下载HTML"按钮保存符合书单页面样式的md文档</span>
              </div>
              <div class="tip-item">
                <n-icon class="tip-icon" size="16">
                  <FolderIcon />
                </n-icon>
                <span>将生成的md文档放到博客的 <code>source/books</code> 目录内</span>
              </div>
              <div class="tip-item">
                <n-icon class="tip-icon" size="16">
                  <RefreshIcon />
                </n-icon>
                <span>点击"从文件加载"导入现有书单文件</span>
              </div>
            </div>
          </div>
        </n-alert>
      </div>

      <!-- 操作按钮区域 -->
      <n-space justify="space-between">
        <n-space>
          <n-button type="primary" @click="showAddModal = true">
            <template #icon>
              <n-icon><AddIcon /></n-icon>
            </template>
            添加书籍
          </n-button>
          
          <n-button @click="showUsageModal = true">
            <template #icon>
              <n-icon><QuestionIcon /></n-icon>
            </template>
            使用说明
          </n-button>
          
          <n-button @click="loadFromFile">
            <template #icon>
              <n-icon><RefreshIcon /></n-icon>
            </template>
            从文件加载
          </n-button>
          
          <n-button @click="resetSortOrder" v-if="books.length > 0 && hasBlogConfig" type="warning">
            <template #icon>
              <n-icon><RefreshIcon /></n-icon>
            </template>
            回溯调整
          </n-button>
          
          <n-button @click="clearAllCache" type="error">
            <template #icon>
              <n-icon><RefreshIcon /></n-icon>
            </template>
            清除缓存
          </n-button>
        </n-space>
        
        <n-space>
          <n-button-group>
            <n-button 
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
            >
              <template #icon>
                <n-icon><GridIcon /></n-icon>
              </template>
              网格
            </n-button>
            <n-button 
              :type="viewMode === 'table' ? 'primary' : 'default'"
              @click="viewMode = 'table'"
            >
              <template #icon>
                <n-icon><ListIcon /></n-icon>
              </template>
              表格
            </n-button>
          </n-button-group>
          
          <n-button @click="refreshSettings">
            <template #icon>
              <n-icon><RefreshIcon /></n-icon>
            </template>
            刷新
          </n-button>
          
          <!-- 版本检查控件 -->
          <VersionCheckControl
            :checking-versions="checkingVersions"
            :has-blog-config="hasBlogConfig"
            :version-status-display="versionStatusDisplay"
            :version-conflict-data="versionConflictData"
            v-model:show-version-conflict="showVersionConflict"
            @manual-check="manualCheckVersions"
            @conflict-resolved="handleVersionConflictResolved"
          />
          
          <n-button @click="generateHTML">
            <template #icon>
              <n-icon><SaveIcon /></n-icon>
            </template>
            另存或下载书籍HTML
          </n-button>
        </n-space>
      </n-space>

      <!-- 书籍列表 - 网格视图 -->
      <div v-if="viewMode === 'grid'" class="books-grid">
        <div v-if="loading" class="loading-container">
          <n-spin size="large" />
        </div>
        <div v-else-if="books.length === 0" class="empty-container">
          <n-empty description="暂无书籍数据" />
        </div>
        <div v-else>
          <!-- 分页模式 -->
          <div v-if="infiniteScrollSettings.loadMode === 'pagination'" class="grid-with-pagination">
            <VueDraggableNext 
              v-model="currentGridBooksRef"
              :animation="200"
              ghost-class="ghost"
              chosen-class="chosen"
              drag-class="drag"
              @end="handleGridDragEnd"
              class="draggable-grid"
            >
              <div 
                v-for="book in currentGridBooksRef" 
                :key="book.id" 
                class="draggable-item"
              >
                <BookCard 
                  :book="book"
                  :enable-lazy-load="infiniteScrollSettings.loadMode === 'infinite'"
                  @edit="editBook"
                  @delete="deleteBook"
                />
              </div>
            </VueDraggableNext>
            <!-- 网格分页 -->
            <div class="grid-pagination">
              <n-pagination
                v-model:page="gridPagination.page"
                :page-size="gridPagination.pageSize"
                :item-count="books.length"
                :show-size-picker="gridPagination.showSizePicker"
                :page-sizes="gridPagination.pageSizes"
                :show-quick-jumper="gridPagination.showQuickJumper"
              />
            </div>
          </div>
          
          <!-- 无限滚动模式 -->
          <div v-else class="grid-with-infinite-scroll">
            <VueDraggableNext 
              v-model="currentGridBooksRef"
              :animation="200"
              ghost-class="ghost"
              chosen-class="chosen"
              drag-class="drag"
              @end="handleGridDragEnd"
              class="draggable-grid"
            >
              <div 
                v-for="book in currentGridBooksRef" 
                :key="book.id" 
                class="draggable-item"
              >
                <BookCard 
                  :book="book"
                  :enable-lazy-load="infiniteScrollSettings.loadMode === 'infinite'"
                  @edit="editBook"
                  @delete="deleteBook"
                />
              </div>
            </VueDraggableNext>
            
            <!-- 加载更多触发器 -->
            <div 
              ref="loadMoreTrigger" 
              class="load-more-trigger"
              v-if="loadedBooksCount < books.length"
            >
              <div v-if="isLoadingMore" class="loading-more">
                <n-spin size="small" />
                <span>加载中...</span>
              </div>
              <div v-else class="load-more-options">
                <div class="load-more-hint">
                  <span>向下滚动加载更多</span>
                </div>
                <div class="load-all-section">
                  <n-button size="small" type="primary" ghost @click="loadAllBooks">
                    显示全部 ({{ books.length - loadedBooksCount }} 本)
                  </n-button>
                </div>
              </div>
            </div>
            
            <!-- 全部加载完成提示 -->
            <div v-else class="all-loaded">
              <span>已显示全部 {{ books.length }} 本书籍</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 书籍列表 - 表格视图 -->
      <div v-else class="table-container">
        <div v-if="loading" class="loading-container">
          <n-spin size="large" />
        </div>
        <div v-else-if="books.length === 0" class="empty-container">
          <n-empty description="暂无书籍数据" />
        </div>
        <div v-else class="custom-table">
          <!-- 表格头部 -->
          <div class="table-header">
            <div class="th drag-col">拖拽</div>
            <div class="th cover-col">封面</div>
            <div class="th title-col">标题</div>
            <div class="th author-col">作者</div>
            <div class="th isbn-col">ISBN</div>
            <div class="th description-col">描述</div>
            <div class="th actions-col">操作</div>
          </div>
          <!-- 可拖拽的表格主体 -->
          <VueDraggableNext 
            v-model="paginatedBooksRef"
            :animation="200"
            ghost-class="ghost-row"
            chosen-class="chosen-row"
            drag-class="drag-row"
            @end="handleTableDragEnd"
            handle=".drag-handle"
            tag="div"
            class="table-body"
          >
            <div 
              v-for="(book, index) in paginatedBooksRef" 
              :key="book.id" 
              class="table-row"
            >
              <div class="td drag-col">
                <div class="drag-handle">⋮⋮</div>
              </div>
              <div class="td cover-col">
                <img 
                  v-if="book.cover" 
                  :src="book.cover" 
                  :alt="book.title"
                  class="cover-img"
                />
                <div v-else class="no-cover">无封面</div>
              </div>
              <div class="td title-col">{{ book.title }}</div>
              <div class="td author-col">{{ book.author }}</div>
              <div class="td isbn-col">{{ book.isbn }}</div>
              <div class="td description-col">
                <div class="description-text">{{ book.description }}</div>
              </div>
              <div class="td actions-col">
                <n-space size="small">
                  <n-button size="small" @click="editBook(book)">编辑</n-button>
                  <n-button size="small" type="error" @click="deleteBook(book.id)">删除</n-button>
                </n-space>
              </div>
            </div>
          </VueDraggableNext>
          <!-- 分页 -->
          <div class="table-pagination">
            <n-pagination
              v-model:page="pagination.page"
              :page-size="pagination.pageSize"
              :item-count="books.length"
              :show-size-picker="pagination.showSizePicker"
              :page-sizes="pagination.pageSizes"
              :show-quick-jumper="pagination.showQuickJumper"
            />
          </div>
        </div>
      </div>
    </n-space>

    <!-- 添加书籍模态框 -->
    <n-modal v-model:show="showAddModal" preset="card" title="添加书籍" style="width: 600px;">
      <AddBookForm 
        :image-bed-config="props.imageBedConfig"
        :isbn-api-config="props.isbnApiConfig"
        @save="handleAddBook" 
        @cancel="showAddModal = false" 
      />
    </n-modal>

    <!-- 使用说明模态框 -->
    <n-modal v-model:show="showUsageModal" preset="card" title="使用说明" style="width: 500px;">
      <div style="padding: 20px;">
        <n-space vertical size="large">
          <n-alert type="info" style="margin-bottom: 20px;">
            <template #header>
              <span style="font-weight: 600;">如何添加书籍</span>
            </template>
            <p>请按照以下步骤添加书籍：</p>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>点击下方按钮访问豆瓣图书网站</li>
              <li>在豆瓣图书中搜索您想要的书籍</li>
              <li>找到书籍页面后，复制页面中的ISBN号码</li>
              <li>返回软件，点击"添加书籍"按钮</li>
              <li>选择"ISBN"方式，粘贴ISBN号码并点击"获取信息"</li>
              <li>系统会自动填充书籍信息，您可以补充个人评价等内容</li>
            </ol>
          </n-alert>
          
          <n-space justify="center">
            <n-button type="primary" size="large" @click="openDoubanWebsite">
              <template #icon>
                <n-icon><LinkIcon /></n-icon>
              </template>
              访问豆瓣图书网站
            </n-button>
          </n-space>
          
          <n-text depth="3" style="text-align: center; display: block;">
            点击上方按钮将在新窗口中打开豆瓣图书官网
          </n-text>
        </n-space>
      </div>
    </n-modal>

    <!-- 编辑书籍模态框 -->
    <n-modal v-model:show="showEditModal" preset="card" title="编辑书籍" style="width: 600px;">
      <EditBookForm 
        v-if="editingBook"
        :image-bed-config="props.imageBedConfig"
        :isbn-api-config="props.isbnApiConfig"
        :book="editingBook"
        @save="handleEditBook" 
        @cancel="showEditModal = false; editingBook = null" 
      />
    </n-modal>

    <!-- 首次设置引导 -->
    <FirstTimeSetup
      v-model:visible="showFirstTimeSetup"
      @completed="handleFirstTimeSetupCompleted"
    />
    
    <!-- 回到顶部按钮 -->
    <Transition name="back-to-top">
      <div 
        v-if="showBackToTop && infiniteScrollSettings.loadMode === 'infinite'" 
        class="back-to-top"
        @click="scrollToTop"
      >
        <n-button circle type="primary" size="large">
          <template #icon>
            <n-icon size="20">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
            </n-icon>
          </template>
        </n-button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, h, computed, watch, nextTick } from 'vue'
import { NButton, NSpace, NModal, NIcon, NButtonGroup, NSpin, NEmpty, NAlert, NPagination, NText, NTag, useMessage, useDialog } from 'naive-ui'
import { VueDraggableNext } from 'vue-draggable-next'
import AddBookForm from './AddBookForm.vue'
import EditBookForm from './EditBookForm.vue'
import BookCard from './BookCard.vue'
import FirstTimeSetup from './FirstTimeSetup.vue'
import VersionCheckControl from './VersionCheckControl.vue'
import { AddIcon, RefreshIcon, SaveIcon, GridIcon, ListIcon, QuestionIcon, LinkIcon, SyncIcon, FolderIcon, DatabaseIcon, CopyIcon } from './Icons'
import type { Book, IsbnApiConfig } from '../types'
import { parseExistingBooks, generateIndexMd, type OriginalFileStructure } from '../utils/bookParser'
import { readFile, downloadFile, storage, type FileInfo } from '../utils/browserAPI'
import type { ImageBedConfig } from '../utils/imageBed'
import { getSampleBooks } from '../config/sampleData'
import { useVersionCheck } from '../composables/useVersionCheck'
import { useFirstTimeSetup } from '../composables/useFirstTimeSetup'

// 接收图床配置和ISBN API配置
const props = defineProps<{
  imageBedConfig: ImageBedConfig
  isbnApiConfig: IsbnApiConfig
}>()

const message = useMessage()
const dialog = useDialog()
const books = ref<Book[]>([])
const originalFileOrder = ref<Book[]>([]) // 保存文件导入时的原始顺序
const originalFileStructure = ref<OriginalFileStructure | null>(null) // 保存原始文件结构
const loading = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const showUsageModal = ref(false)
const editingBook = ref<Book | null>(null)
const viewMode = ref<'grid' | 'table'>('grid')
const currentFile = ref<{ fileName: string; filePath: string } | null>(null)

// 使用版本检查 composable
const {
  versionStatus,
  checkingVersions,
  versionConflictData,
  showVersionConflict,
  blogConfigState,
  hasBlogConfig,
  versionStatusDisplay,
  setVersionStatus,
  forceSetVersionStatus,
  checkVersions,
  manualCheckVersions,
  handleVersionConflictResolved,
  resetSortOrder: resetSortOrderFromComposable,
  updateBlogConfigState,
  notifyVersionStatusUpdate,
  versionSyncManager
} = useVersionCheck({
  onVersionStatusChange: (status) => {
    console.log('版本状态变更:', status)
  },
  onConflictResolved: (success) => {
    if (success) {
      // 冲突解决成功后可能需要刷新数据
      loadBooks()
    }
  }
})

// 使用首次设置 composable
const {
  showFirstTimeSetup,
  checkIfFirstTimeUser,
  handleFirstTimeSetupCompleted: handleFirstTimeSetupCompletedCore
} = useFirstTimeSetup({
  onDataLoaded: (loadedBooks, loadedFile) => {
    // 数据加载回调
    books.value = loadedBooks
    currentFile.value = loadedFile
    originalFileOrder.value = loadedBooks
    originalFileStructure.value = storage.load<OriginalFileStructure>('originalFileStructure', null)
  }
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  showQuickJumper: true
})

// 网格视图独立分页配置
const gridPagination = reactive({
  page: 1,
  pageSize: 12,
  showSizePicker: true,
  pageSizes: [6, 12, 18, 24, 30],
  showQuickJumper: true
})

// 无限滚动相关状态
const infiniteScrollSettings = reactive({
  loadMode: 'pagination' as 'pagination' | 'infinite',
  batchSize: 12,
  enableVirtualScroll: false
})

const loadedBooksCount = ref(0) // 已加载的书籍数量，动态计算
const isLoadingMore = ref(false) // 是否正在加载更多
const loadMoreTrigger = ref<HTMLElement>() // 加载更多的触发元素
const showBackToTop = ref(false) // 是否显示回到顶部按钮

// 分页数据计算属性
const paginatedBooks = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return books.value.slice(start, end)
})

// 网格视图分页数据计算属性
const paginatedGridBooks = computed(() => {
  const start = (gridPagination.page - 1) * gridPagination.pageSize
  const end = start + gridPagination.pageSize
  return books.value.slice(start, end)
})

// 无限滚动网格数据计算属性
const infiniteScrollGridBooks = computed(() => {
  return books.value.slice(0, loadedBooksCount.value)
})

// 当前网格视图使用的书籍数据
const currentGridBooks = computed(() => {
  if (infiniteScrollSettings.loadMode === 'infinite') {
    return infiniteScrollGridBooks.value
  } else {
    return paginatedGridBooks.value
  }
})

// 为表格拖拽创建一个响应式引用
const paginatedBooksRef = ref<Book[]>([])

// 为网格拖拽创建一个响应式引用
const currentGridBooksRef = ref<Book[]>([])

// 监听paginatedBooks的变化并更新引用
watch(paginatedBooks, (newVal) => {
  paginatedBooksRef.value = [...newVal]
}, { immediate: true })

// 监听currentGridBooks的变化并更新引用
watch(currentGridBooks, (newVal) => {
  currentGridBooksRef.value = [...newVal]
}, { immediate: true })

// 无限滚动相关函数
const loadMoreBooks = () => {
  if (isLoadingMore.value || loadedBooksCount.value >= books.value.length) {
    return
  }
  
  isLoadingMore.value = true
  
  // 模拟加载延迟
  setTimeout(() => {
    const remainingBooks = books.value.length - loadedBooksCount.value
    const toLoad = Math.min(infiniteScrollSettings.batchSize, remainingBooks)
    loadedBooksCount.value += toLoad
    isLoadingMore.value = false
  }, 300)
}

// 设置 Intersection Observer
const setupIntersectionObserver = () => {
  if (!loadMoreTrigger.value) return
  
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && infiniteScrollSettings.loadMode === 'infinite') {
        loadMoreBooks()
      }
    },
    {
      rootMargin: '100px' // 提前100px触发加载
    }
  )
  
  observer.observe(loadMoreTrigger.value)
  
  // 返回清理函数
  return () => observer.disconnect()
}

// 重置无限滚动状态
const resetInfiniteScroll = () => {
  loadedBooksCount.value = Math.min(infiniteScrollSettings.batchSize, books.value.length)
}

// 监听页面滚动，显示/隐藏回到顶部按钮
const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

// 回到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 加载全部书籍
const loadAllBooks = () => {
  if (isLoadingMore.value) return
  
  isLoadingMore.value = true
  setTimeout(() => {
    loadedBooksCount.value = books.value.length
    isLoadingMore.value = false
    message.success(`已显示全部 ${books.value.length} 本书籍`)
  }, 500)
}

// 刷新设置 - 立即应用用户在设置界面的更改
const refreshSettings = () => {
  try {
    // 从本地存储读取最新的应用设置
    const savedSettings = storage.load('appSettings', null)
    
    if (!savedSettings) {
      message.info('未找到设置配置，使用默认配置')
      return
    }
    
    // 记录当前状态，用于检测变化
    const oldViewMode = viewMode.value
    const oldLoadMode = infiniteScrollSettings.loadMode
    const oldBatchSize = infiniteScrollSettings.batchSize
    
    // 立即应用视图模式设置
    if (savedSettings?.general?.defaultViewMode) {
      viewMode.value = savedSettings.general.defaultViewMode
    }
    
    // 立即应用网格加载模式设置
    if (savedSettings?.general?.gridLoadMode) {
      infiniteScrollSettings.loadMode = savedSettings.general.gridLoadMode
    }
    
    // 更新分页设置
    if (savedSettings?.general?.gridViewPageSize) {
      gridPagination.pageSize = savedSettings.general.gridViewPageSize
    }
    if (savedSettings?.general?.tableViewPageSize) {
      pagination.pageSize = savedSettings.general.tableViewPageSize
    }
    
    // 更新无限滚动设置
    if (savedSettings?.general?.infiniteScrollBatchSize) {
      infiniteScrollSettings.batchSize = savedSettings.general.infiniteScrollBatchSize
    }
    if (savedSettings?.general?.enableVirtualScroll !== undefined) {
      infiniteScrollSettings.enableVirtualScroll = savedSettings.general.enableVirtualScroll
    }
    
    // 处理模式切换的副作用
    if (oldLoadMode !== infiniteScrollSettings.loadMode) {
      // 加载模式发生变化，需要重新配置相关功能
      handleLoadModeChange(oldLoadMode, infiniteScrollSettings.loadMode)
    } else if (infiniteScrollSettings.loadMode === 'infinite' && oldBatchSize !== infiniteScrollSettings.batchSize) {
      // 无限滚动模式下，批量大小发生变化，需要重新计算已加载数量
      resetInfiniteScroll()
    }
    
    // 构建更新消息
    const changes = []
    if (oldViewMode !== viewMode.value) {
      changes.push(`视图模式: ${viewMode.value === 'grid' ? '网格' : '表格'}`)
    }
    if (oldLoadMode !== infiniteScrollSettings.loadMode) {
      changes.push(`加载方式: ${infiniteScrollSettings.loadMode === 'infinite' ? '无限滚动' : '分页'}`)
    }
    
    if (changes.length > 0) {
      message.success(`设置已更新: ${changes.join(', ')}`)
    } else {
      message.success('设置已刷新')
    }
    
  } catch (error) {
    console.error('刷新设置失败:', error)
    message.error('刷新设置失败')
  }
}

// 处理加载模式切换时的副作用
const handleLoadModeChange = (oldMode: string, newMode: string) => {
  // 重置无限滚动状态
  resetInfiniteScroll()
  
  // 动态管理事件监听器
  window.removeEventListener('scroll', handleScroll)
  
  if (newMode === 'infinite') {
    // 切换到无限滚动模式
    window.addEventListener('scroll', handleScroll)
    nextTick(() => {
      setupIntersectionObserver()
    })
  }
  
  // 重置分页到第一页
  pagination.page = 1
  gridPagination.page = 1
  
  // 重置回到顶部按钮状态
  showBackToTop.value = false
}

const loadBooks = async () => {
  loading.value = true
  try {
    // 优先从本地存储加载用户的最新数据（修复数据持久化问题）
    const savedBooks = storage.load<Book[]>('books', [])
    const savedOriginalOrder = storage.load<Book[]>('originalFileOrder', [])
    const savedOriginalStructure = storage.load<OriginalFileStructure | null>('originalFileStructure', null)
    const savedFile = storage.load<{ fileName: string; filePath: string } | null>('currentFile', null)
    
    // 数据恢复检测
    if (savedBooks.length === 0) {
      const recoveryResult = await versionSyncManager.detectDataLoss()
      
      if (recoveryResult.hasDataLoss) {
        const confirmed = window.confirm(
          `检测到可能的数据丢失！\n\n` +
          `发现备份数据包含 ${recoveryResult.backupBooks.length} 本书籍。\n` +
          `是否要恢复这些数据？\n\n` +
          `点击"确定"恢复备份数据，点击"取消"使用示例数据。`
        )
        
        if (confirmed) {
          const recoverySuccess = await versionSyncManager.recoverData('restore_from_backup')
          if (recoverySuccess) {
            message.success('数据恢复成功！')
            // 重新加载恢复的数据
            const recoveredBooks = storage.load<Book[]>('books', [])
            if (recoveredBooks.length > 0) {
              books.value = recoveredBooks.sort((a, b) => {
                if (a.sort_order !== undefined && b.sort_order !== undefined) {
                  return a.sort_order - b.sort_order
                }
                if (a.sort_order !== undefined) return -1
                if (b.sort_order !== undefined) return 1
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
              })
              originalFileOrder.value = savedOriginalOrder
              originalFileStructure.value = savedOriginalStructure
              currentFile.value = savedFile
              
              message.success(`数据恢复完成，恢复了 ${books.value.length} 本书籍`)
              
              // 检查版本（延迟执行）
              setTimeout(() => {
                checkVersions()
              }, 1000)
              
              return
            }
          } else {
            message.error('数据恢复失败')
          }
        }
      }
    }
    
    if (savedBooks && savedBooks.length > 0) {
      // 按照 sort_order 排序，如果没有 sort_order 则按创建时间倒序
      books.value = savedBooks.sort((a, b) => {
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order
        }
        if (a.sort_order !== undefined) return -1
        if (b.sort_order !== undefined) return 1
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })
      originalFileOrder.value = savedOriginalOrder
      originalFileStructure.value = savedOriginalStructure
      currentFile.value = savedFile
      
      // 检查版本状态 - 如果当前文件是博客文件，设置为已同步
      const blogConfig = versionSyncManager.getBlogConfig()
      blogConfigState.value = blogConfig // 更新响应式状态
      if (blogConfig && blogConfig.blogPath && currentFile.value && currentFile.value.filePath === blogConfig.blogPath) {
        setVersionStatus('synced')
      } else if (blogConfig && blogConfig.blogPath) {
        setVersionStatus('unknown')
      } else {
        setVersionStatus('unknown')
      }
      
      message.success(`已加载 ${savedBooks.length} 本书籍`)
    } else {
      // 如果没有保存的数据，使用示例数据
      books.value = getSampleBooks()
      originalFileOrder.value = []
      
      // 重要：不要覆盖已经设置的 currentFile
      // 只有当 currentFile 真的不存在时才设置为 null
      if (!currentFile.value) {
        currentFile.value = null
      }
      
      // 使用示例数据时，检查博客配置状态
      const blogConfig = versionSyncManager.getBlogConfig()
      if (blogConfig && blogConfig.blogPath) {
        setVersionStatus('unknown')
      } else {
        setVersionStatus('unknown')
      }
      
      message.info('使用示例数据，您可以通过"从文件加载"来导入现有书单')
    }
    
    // 检查版本（延迟执行）
    setTimeout(() => {
      checkVersions()
    }, 1000)
    
    // 重置无限滚动状态
    resetInfiniteScroll()
    
  } catch (error) {
    console.error('加载书籍失败:', error)
    message.error('加载书籍失败')
  } finally {
    loading.value = false
  }
}

const loadFromFile = async () => {
  loading.value = true
  
  try {
    let fileContent: string = ''
    let fileName: string = ''
    let filePath: string = ''
    
    if (window.electronAPI && window.electronAPI.selectMdFile) {
      // Electron环境：使用原生文件选择
      const result = await window.electronAPI.selectMdFile()
      
      if (result.success && result.data) {
        fileContent = result.data.content
        fileName = result.data.fileName
        filePath = result.data.filePath
      } else {
        return // 用户取消选择或出错
      }
    } else {
      // 浏览器环境：使用文件API
      const fileInfo = await readFile()
      if (!fileInfo) return // 用户取消选择
      
      fileContent = fileInfo.content
      fileName = fileInfo.fileName
      filePath = '' // 浏览器环境无法获取真实路径
    }
    
    // 解析文件内容
    const parseResult = parseExistingBooks(fileContent)
    
    if (parseResult.books.length === 0) {
      message.warning('文件中没有找到书籍数据')
      return
    }
    
    // 为从文件加载的书籍分配sort_order
    const booksWithOrder = parseResult.books.map((book, index) => ({
      ...book,
      sort_order: index
    }))
    
    // 保存原始文件顺序和结构
    originalFileOrder.value = JSON.parse(JSON.stringify(booksWithOrder))
    originalFileStructure.value = parseResult.structure
    
    // 更新书籍数据
    books.value = booksWithOrder
    
    // 更新当前文件信息
    currentFile.value = { fileName, filePath }
    
    // 保存到本地存储
    storage.save('books', booksWithOrder)
    storage.save('originalFileOrder', originalFileOrder.value)
    storage.save('originalFileStructure', originalFileStructure.value)
    storage.save('currentFile', currentFile.value)
    
    // 如果配置了博客路径且刚从该文件加载，设置为已同步状态
    const blogConfig = versionSyncManager.getBlogConfig()
    if (blogConfig && blogConfig.blogPath && filePath === blogConfig.blogPath) {
      // 刚从博客文件加载，应该是同步状态
      setVersionStatus('synced')
    } else if (blogConfig && blogConfig.blogPath) {
      // 从其他文件加载，可能需要检查冲突
      setVersionStatus('unknown')
      // 检查版本冲突（延迟执行以确保数据已保存）
      setTimeout(() => {
        checkVersions()
      }, 500)
    } else {
      // 没有配置博客路径，状态未知
      setVersionStatus('unknown')
    }
    
    message.success(`成功从文件加载 ${parseResult.books.length} 本书籍`)
    
  } catch (error) {
    console.error('文件加载失败:', error)
    message.error('文件加载失败')
  } finally {
    loading.value = false
  }
}

const saveBooks = () => {
  try {
    const success = storage.save('books', books.value)
    if (!success) {
      console.error('书籍数据保存失败')
      message.error('书籍数据保存失败')
      return false
    }
    
    // 修改后不再自动同步到博客文件
    // 用户需要手动进行版本检查和确认
    
    // 如果配置了博客路径，更新版本状态为可能有冲突
    notifyVersionStatusUpdate()
    
    return true
  } catch (error) {
    console.error('保存书籍失败:', error)
    message.error('保存书籍失败')
    return false
  }
}

const handleAddBook = (book: Book) => {
  // 为新书籍设置sort_order为0，其他书籍的sort_order都加1
  books.value.forEach(existingBook => {
    if (existingBook.sort_order !== undefined) {
      existingBook.sort_order += 1
    }
  })
  
  // 新书籍排序顺序设为0，显示在最前面
  const newBook = {
    ...book,
    sort_order: 0
  }
  
  books.value.unshift(newBook)
  showAddModal.value = false
  
  // 自动保存到缓存
  saveBooks()
  
  // 提示用户检查版本冲突
  const blogConfig = versionSyncManager.getBlogConfig()
  if (blogConfig && blogConfig.blogPath) {
    message.success('添加书籍成功！请点击"版本检查"按钮查看是否需要同步到博客文件')
  } else {
    message.success('添加书籍成功')
  }
}

const handleEditBook = (book: Book) => {
  const index = books.value.findIndex(b => b.id === book.id)
  if (index !== -1) {
    books.value[index] = book
    showEditModal.value = false
    editingBook.value = null
    
    // 自动保存到缓存
    saveBooks()
    
    // 提示用户检查版本冲突
    const blogConfig = versionSyncManager.getBlogConfig()
    if (blogConfig && blogConfig.blogPath) {
      message.success('更新书籍成功！请点击"版本检查"按钮查看是否需要同步到博客文件')
    } else {
      message.success('更新书籍成功')
    }
  }
}

const editBook = (book: Book) => {
  editingBook.value = book
  showEditModal.value = true
}

const deleteBook = (id: string) => {
  books.value = books.value.filter(book => book.id !== id)
  
  // 自动保存到缓存
  saveBooks()
  
  // 提示用户检查版本冲突
  const blogConfig = versionSyncManager.getBlogConfig()
  if (blogConfig && blogConfig.blogPath) {
    message.success('删除书籍成功！请点击"版本检查"按钮查看是否需要同步到博客文件')
  } else {
    message.success('删除书籍成功')
  }
}

// 处理拖拽排序
const handleDragEnd = () => {
  // 重新计算所有书籍的sort_order
  books.value.forEach((book, index) => {
    book.sort_order = index
    book.updated_at = new Date().toISOString()
  })
  
  // 自动保存到缓存
  saveBooks()
  
  // 提示用户检查版本冲突
  const blogConfig = versionSyncManager.getBlogConfig()
  if (blogConfig && blogConfig.blogPath) {
    message.success('排序已更新！请点击"版本检查"按钮查看是否需要同步到博客文件')
  } else {
    message.success('排序已更新')
  }
}

// 处理网格拖拽排序
const handleGridDragEnd = () => {
  if (infiniteScrollSettings.loadMode === 'infinite') {
    // 无限滚动模式：直接更新全局顺序
    currentGridBooksRef.value.forEach((book, index) => {
      const originalIndex = books.value.findIndex(b => b.id === book.id)
      if (originalIndex !== -1) {
        // 移动书籍到正确位置
        books.value.splice(originalIndex, 1)
        books.value.splice(index, 0, book)
      }
    })
  } else {
    // 分页模式：计算当前页的起始索引
    const startIndex = (gridPagination.page - 1) * gridPagination.pageSize
    
    // 将分页数据的排序应用到原始数据
    currentGridBooksRef.value.forEach((book, index) => {
      const originalIndex = books.value.findIndex(b => b.id === book.id)
      if (originalIndex !== -1) {
        // 移动书籍到正确位置
        books.value.splice(originalIndex, 1)
        books.value.splice(startIndex + index, 0, book)
      }
    })
  }
  
  // 重新计算所有书籍的sort_order
  books.value.forEach((book, index) => {
    book.sort_order = index
    book.updated_at = new Date().toISOString()
  })
  
  // 自动保存到缓存
  saveBooks()
  
  // 提示用户检查版本冲突
  const blogConfig = versionSyncManager.getBlogConfig()
  if (blogConfig && blogConfig.blogPath) {
    message.success('排序已更新！请点击"版本检查"按钮查看是否需要同步到博客文件')
  } else {
    message.success('排序已更新')
  }
}

// 处理表格拖拽排序
const handleTableDragEnd = () => {
  // 计算当前页的起始索引
  const startIndex = (pagination.page - 1) * pagination.pageSize
  
  // 将分页数据的排序应用到原始数据
  paginatedBooksRef.value.forEach((book, index) => {
    const originalIndex = books.value.findIndex(b => b.id === book.id)
    if (originalIndex !== -1) {
      // 移动书籍到正确位置
      books.value.splice(originalIndex, 1)
      books.value.splice(startIndex + index, 0, book)
    }
  })
  
  // 重新计算所有书籍的sort_order
  books.value.forEach((book, index) => {
    book.sort_order = index
    book.updated_at = new Date().toISOString()
  })
  
  // 自动保存到缓存
  saveBooks()
  
  // 提示用户检查版本冲突
  const blogConfig = versionSyncManager.getBlogConfig()
  if (blogConfig && blogConfig.blogPath) {
    message.success('排序已更新！请点击"版本检查"按钮查看是否需要同步到博客文件')
  } else {
    message.success('排序已更新')
  }
}

// 回溯调整 - 使用博客文件的数据覆盖缓存
const resetSortOrder = async () => {
  const syncedBooks = await resetSortOrderFromComposable()
  if (syncedBooks && syncedBooks.length > 0) {
    books.value = syncedBooks
    originalFileOrder.value = syncedBooks
    originalFileStructure.value = storage.load<OriginalFileStructure>('originalFileStructure', null)
    currentFile.value = storage.load<{ fileName: string; filePath: string }>('currentFile', null)
  }
}

const clearAllCache = () => {
  // 显示确认对话框
  const confirmed = window.confirm('确定要清除所有缓存数据吗？这将删除所有书籍数据、设置和历史记录。')
  
  if (confirmed) {
    try {
      // 清除所有localStorage数据
      storage.clear()
      
      // 重置所有状态
      books.value = []
      originalFileOrder.value = []
      originalFileStructure.value = null
      currentFile.value = null
      
      message.success('缓存已清除，应用已重置为初始状态')
      
      // 重新加载页面以确保完全重置
      setTimeout(() => {
        location.reload()
      }, 1000)
    } catch (error) {
      console.error('清除缓存失败:', error)
      message.error('清除缓存失败')
    }
  }
}

const generateHTML = async () => {
  try {
    if (books.value.length === 0) {
      message.warning('没有书籍数据')
      return
    }
    
    // 生成HTML内容
    const htmlContent = generateIndexMd(books.value, originalFileStructure.value || undefined)
    
    // 生成带时间戳的文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `books-index-${timestamp}.md`
    
    // 使用下载模式
    downloadFile(htmlContent, filename, 'text/markdown')
    message.success(`HTML已生成并下载为 ${filename}`)
    
  } catch (error) {
    console.error('HTML生成失败:', error)
    message.error('HTML生成失败')
  }
}

const openDoubanWebsite = () => {
  // 在 Electron 环境中使用 electronAPI，否则使用 window.open
  if (window.electronAPI && window.electronAPI.openExternalLink) {
    window.electronAPI.openExternalLink('https://book.douban.com/')
  } else {
    window.open('https://book.douban.com/', '_blank')
  }
}

// 路径美化处理函数
const formatPath = (path: string): string => {
  if (!path) return ''
  
  // 直接返回完整路径，不进行截断
  return path
}

// 复制路径到剪贴板
const copyPathToClipboard = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path)
    message.success('路径已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败')
  }
}

// 判断是否为博客目录模式
const isBlogMode = computed(() => {
  const blogConfig = versionSyncManager.getBlogConfig()
  return blogConfig && blogConfig.blogPath && currentFile.value && currentFile.value.filePath === blogConfig.blogPath
})

// 包装首次设置完成处理函数
const handleFirstTimeSetupCompleted = async (blogPath: string | null) => {
  const result = await handleFirstTimeSetupCompletedCore(
    blogPath,
    setVersionStatus,
    forceSetVersionStatus,
    blogConfigState
  )
  
  // 更新本地状态
  books.value = result.books
  currentFile.value = result.currentFile
  originalFileOrder.value = result.originalFileOrder
  originalFileStructure.value = result.originalFileStructure
}



onMounted(() => {
  // 从本地存储读取应用设置
  const savedSettings = storage.load('appSettings', null)
  if (savedSettings?.general?.defaultViewMode) {
    viewMode.value = savedSettings.general.defaultViewMode
  }
  
  // 应用分页设置
  if (savedSettings?.general?.gridViewPageSize) {
    gridPagination.pageSize = savedSettings.general.gridViewPageSize
  }
  if (savedSettings?.general?.tableViewPageSize) {
    pagination.pageSize = savedSettings.general.tableViewPageSize
  }
  
  // 应用无限滚动设置
  if (savedSettings?.general?.gridLoadMode) {
    infiniteScrollSettings.loadMode = savedSettings.general.gridLoadMode
  }
  if (savedSettings?.general?.infiniteScrollBatchSize) {
    infiniteScrollSettings.batchSize = savedSettings.general.infiniteScrollBatchSize
  }
  if (savedSettings?.general?.enableVirtualScroll !== undefined) {
    infiniteScrollSettings.enableVirtualScroll = savedSettings.general.enableVirtualScroll
  }
  
  loadBooks()
  checkIfFirstTimeUser()
  
  // 确保在设置应用后正确初始化无限滚动状态
  nextTick(() => {
    // 在数据加载和设置应用完成后，确保 loadedBooksCount 正确初始化
    if (infiniteScrollSettings.loadMode === 'infinite' && loadedBooksCount.value === 0) {
      resetInfiniteScroll()
    }
  })
  
  // 在下一个tick设置 Intersection Observer
  nextTick(() => {
    if (infiniteScrollSettings.loadMode === 'infinite') {
      setupIntersectionObserver()
    }
  })
  
  // 监听滚动事件（仅在无限滚动模式下）
  if (infiniteScrollSettings.loadMode === 'infinite') {
    window.addEventListener('scroll', handleScroll)
  }
})

// 清理函数
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.books-grid {
  min-height: 400px;
}

.grid-with-pagination {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grid-with-infinite-scroll {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.load-more-trigger {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  min-height: 80px;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--n-text-color-2);
  font-size: 14px;
}

.load-more-hint {
  color: var(--n-text-color-3);
  font-size: 14px;
  text-align: center;
  margin-bottom: 12px;
}

.load-more-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.load-all-section {
  display: flex;
  justify-content: center;
}

.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  cursor: pointer;
}

.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: all 0.3s ease;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.all-loaded {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: var(--n-text-color-3);
  font-size: 14px;
  border-top: 1px solid var(--n-border-color);
  background: var(--n-card-color);
  border-radius: 8px;
  margin-top: 20px;
}

.grid-pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid var(--n-border-color);
  background: var(--n-card-color);
  border-radius: 8px;
  margin-top: 20px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

/* 响应式网格布局 */
.grid-container {
  display: grid;
  gap: 20px;
  padding: 8px;
  width: 100%;
}

.draggable-grid {
  display: grid;
  gap: 20px;
  padding: 8px;
  width: 100%;
}

/* 默认布局 - 适用于大多数桌面屏幕 */
.draggable-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* 超大屏幕 (≥1400px) - 最多6列 */
@media (min-width: 1400px) {
  .draggable-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 24px;
  }
}

/* 大屏幕 (≥1200px) - 最多5列 */
@media (min-width: 1200px) and (max-width: 1399px) {
  .draggable-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 22px;
  }
}

/* 中大屏幕 (≥992px) - 最多4列 */
@media (min-width: 992px) and (max-width: 1199px) {
  .draggable-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

/* 中等屏幕 (≥768px) - 最多3列 */
@media (min-width: 768px) and (max-width: 991px) {
  .draggable-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 18px;
  }
}

/* 小屏幕 (≥576px) - 最多2列 */
@media (min-width: 576px) and (max-width: 767px) {
  .draggable-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
}

/* 超小屏幕 (<576px) - 单列 */
@media (max-width: 575px) {
  .draggable-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

/* 拖拽相关样式 */
.draggable-item {
  cursor: move;
  user-select: none;
}

.draggable-item:hover {
  transform: translateY(-2px);
}

/* 拖拽时的视觉效果 */
.ghost {
  opacity: 0.4;
  transform: scale(0.9);
}

.chosen {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.drag {
  transform: rotate(2deg);
  opacity: 0.8;
}

/* 表格相关样式 */
.table-container {
  width: 100%;
}

.custom-table {
  width: 100%;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 80px 1fr 120px 120px 1fr 150px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  font-size: 14px;
}

.table-body {
  min-height: 200px;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 80px 1fr 120px 120px 1fr 150px;
  border-bottom: 1px solid #f0f0f0;
  cursor: move;
  transition: all 0.2s ease;
}

.table-row:hover {
  background-color: #fafafa;
}

.table-row:last-child {
  border-bottom: none;
}

.th, .td {
  padding: 12px 8px;
  display: flex;
  align-items: center;
  border-right: 1px solid #f0f0f0;
  font-size: 14px;
  line-height: 1.4;
}

.th:last-child, .td:last-child {
  border-right: none;
}

.th {
  color: #666;
  justify-content: center;
}

.drag-col {
  justify-content: center;
}

.cover-col {
  justify-content: center;
}

.title-col, .author-col, .isbn-col {
  justify-content: flex-start;
}

.description-col {
  justify-content: flex-start;
}

.actions-col {
  justify-content: center;
}

.drag-handle {
  cursor: grab !important;
  color: #999;
  font-size: 16px;
  user-select: none;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.drag-handle:hover {
  color: #666;
  background: #f0f0f0;
}

.drag-handle:active {
  cursor: grabbing !important;
}

.cover-img {
  width: 40px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.no-cover {
  width: 40px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  font-size: 10px;
  color: #999;
  text-align: center;
}

.description-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-pagination {
  padding: 16px;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--n-border-color);
  background: var(--n-card-color);
}

/* 拖拽状态样式 */
.ghost-row {
  opacity: 0.4;
  background-color: var(--n-color-hover);
}

.chosen-row {
  background-color: var(--n-primary-color-suppl, rgba(24, 160, 88, 0.16));
  border: 2px dashed var(--n-primary-color);
  transform: scale(1.01);
}

.drag-row {
  opacity: 0.8;
  transform: rotate(1deg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 状态提示框样式 - 使用主题变量 */
.status-alert-container {
  margin-bottom: 20px;
}

/* 移除硬编码的背景色和边框，让Naive UI主题变量生效 */
.blog-directory-alert {
  border-radius: 12px;
}

.example-data-alert {
  border-radius: 12px;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 使用主题变量的图标和文字颜色 */
.alert-icon {
  color: var(--n-icon-color);
}

.alert-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--n-title-text-color);
}

.alert-content {
  margin-top: 12px;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.file-name, .file-path {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  color: var(--n-icon-color);
  flex-shrink: 0;
}

.file-name-text {
  font-weight: 500;
  color: var(--n-title-text-color);
}

.file-path-text {
  color: var(--n-content-text-color);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  background: var(--n-color-hover);
  padding: 2px 6px;
  border-radius: 4px;
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.4;
}

.copy-button {
  margin-left: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.copy-button:hover {
  opacity: 1;
}

.operation-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--n-color-hover);
  border-radius: 8px;
  color: var(--n-content-text-color);
  font-size: 14px;
}

.tip-icon {
  color: var(--n-icon-color);
  flex-shrink: 0;
}

.current-status {
  margin-bottom: 12px;
}

.current-status p {
  margin: 0;
  color: var(--n-content-text-color);
  font-size: 14px;
}

.operation-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  color: var(--n-content-text-color);
}

.tip-item .tip-icon {
  color: var(--n-icon-color);
  flex-shrink: 0;
  margin-top: 2px;
}

.tip-item code {
  background: var(--n-color-hover);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: var(--n-content-text-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-info {
    gap: 6px;
  }
  
  .file-name, .file-path {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .file-path-text {
    font-size: 12px;
    word-break: break-all;
  }
  
  .operation-tips {
    gap: 6px;
  }
  
  .tip-item {
    font-size: 12px;
    padding: 4px 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-header, .table-row {
    grid-template-columns: 40px 60px 1fr 80px 100px 120px 100px;
    font-size: 12px;
  }
  
  .th, .td {
    padding: 8px 4px;
  }
  
  .cover-img {
    width: 30px;
    height: 45px;
  }
  
  .no-cover {
    width: 30px;
    height: 45px;
    font-size: 8px;
  }
  
  .description-text {
    max-width: 100px;
  }
}
</style>