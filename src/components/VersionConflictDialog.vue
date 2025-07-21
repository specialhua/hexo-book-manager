<template>
  <n-modal 
    v-model:show="showModal" 
    preset="dialog"
    title="版本冲突"
    :closable="false"
    :mask-closable="false"
    style="width: 600px;"
  >
    <div class="conflict-dialog">
      <n-alert type="warning" style="margin-bottom: 20px;">
        <template #header>
          <n-icon size="20" style="margin-right: 8px;">
            <WarningIcon />
          </n-icon>
          <span style="font-weight: 600;">发现版本冲突</span>
        </template>
        检测到缓存数据与博客文件不一致，请选择要使用的版本。
      </n-alert>

      <div class="version-comparison">
        <div class="version-item">
          <div class="version-header">
            <n-icon size="18" color="#2080f0">
              <DatabaseIcon />
            </n-icon>
            <span class="version-title">缓存版本</span>
            <n-tag type="info" size="small">当前版本</n-tag>
          </div>
          <div class="version-details">
            <div class="detail-item">
              <span class="label">书籍数量:</span>
              <span class="value">{{ compareResult.cacheBooksCount }} 本</span>
            </div>
            <div class="detail-item">
              <span class="label">状态:</span>
              <span class="value">应用中使用的版本</span>
            </div>
          </div>
        </div>

        <div class="version-divider">
          <n-divider style="margin: 0;">VS</n-divider>
        </div>

        <div class="version-item">
          <div class="version-header">
            <n-icon size="18" color="#18a058">
              <FileIcon />
            </n-icon>
            <span class="version-title">博客文件</span>
            <n-tag type="warning" size="small">文件版本</n-tag>
          </div>
          <div class="version-details">
            <div class="detail-item">
              <span class="label">书籍数量:</span>
              <span class="value">{{ compareResult.blogBooksCount }} 本</span>
            </div>
            <div class="detail-item">
              <span class="label">状态:</span>
              <span class="value">博客文件中的版本</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容差异详情 -->
      <div v-if="filteredDifferences.length > 0" class="differences-section">
        <n-alert type="info" style="margin-bottom: 16px;">
          <template #header>
            <span style="font-weight: 600;">发现的差异</span>
          </template>
          <div class="differences-list">
            <div v-for="diff in filteredDifferences.slice(0, 10)" :key="diff.type + diff.field + (diff.bookTitle || '')" class="difference-item">
              <n-tag :type="getDiffTagType(diff.type)" size="small">
                {{ getDiffTypeText(diff.type) }}
              </n-tag>
              <span class="diff-description">{{ formatDifference(diff) }}</span>
            </div>
            <div v-if="filteredDifferences.length > 10" class="more-differences">
              <n-text depth="3" style="font-size: 12px;">
                ...还有 {{ filteredDifferences.length - 10 }} 个差异
              </n-text>
            </div>
          </div>
        </n-alert>
      </div>

      <div class="resolution-options">
        <n-radio-group v-model:value="selectedResolution" name="resolution">
          <n-space vertical>
            <n-radio value="use_cache">
              <div class="option-content">
                <div class="option-title">使用缓存版本</div>
                <div class="option-description">
                  将缓存中的数据覆盖到博客文件，您在应用中的所有修改将被保留
                </div>
              </div>
            </n-radio>
            
            <n-radio value="use_blog">
              <div class="option-content">
                <div class="option-title">使用博客文件版本</div>
                <div class="option-description">
                  从博客文件重新加载数据，缓存中的修改将被覆盖
                </div>
              </div>
            </n-radio>
          </n-space>
        </n-radio-group>
      </div>

      <div class="backup-option">
        <n-checkbox v-model:checked="createBackup">
          <span style="margin-left: 8px;">在覆盖前创建备份文件</span>
        </n-checkbox>
        <n-text depth="3" style="font-size: 12px; margin-left: 24px; display: block; margin-top: 4px;">
          建议保持勾选，以防止数据丢失
        </n-text>
        
        <!-- 备份路径警告提醒 -->
        <n-alert 
          v-if="showBackupWarning" 
          type="warning" 
          size="small"
          style="margin-top: 12px; margin-left: 24px;"
          :show-icon="false"
        >
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 12px; color: #d4801c;">
              ⚠️ 尚未设置备份文件夹，将无法创建备份文件
            </span>
            <n-button 
              size="tiny" 
              type="primary" 
              ghost
              @click="selectBackupPath"
              style="margin-left: 12px; font-size: 11px;"
            >
              立即设置
            </n-button>
          </div>
        </n-alert>
      </div>
    </div>

    <template #action>
      <n-space>
        <n-button @click="handleCancel">
          取消
        </n-button>
        <n-button 
          type="primary" 
          :loading="processing"
          @click="handleConfirm"
        >
          确定
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { 
  NModal, 
  NAlert, 
  NIcon, 
  NTag, 
  NDivider, 
  NRadioGroup, 
  NRadio, 
  NSpace, 
  NCheckbox, 
  NText, 
  NButton,
  useMessage,
  useDialog
} from 'naive-ui'
import { versionSyncManager } from '../utils/versionSync'
import type { VersionCompareResult, ConflictResolution } from '../utils/versionSync'
import { storage } from '../utils/browserAPI'
import type { AppSettings } from '../types'

// 图标组件
const WarningIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z'
  })
])

const DatabaseIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z'
  })
])

const FileIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z'
  })
])

interface Props {
  compareResult: VersionCompareResult
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'resolved': [success: boolean]
}>()

const message = useMessage()
const dialog = useDialog()

const showModal = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

const selectedResolution = ref<'use_cache' | 'use_blog'>('use_cache')
const createBackup = ref(true)
const processing = ref(false)

// 添加本地备份路径状态跟踪
const localBackupPath = ref<string>('')

// 初始化本地备份路径状态
const initLocalBackupPath = () => {
  const savedSettings = storage.load<AppSettings>('appSettings', null)
  if (savedSettings?.backup?.folderPath) {
    localBackupPath.value = savedSettings.backup.folderPath
  }
}

// 组件初始化时设置本地状态
initLocalBackupPath()

// 备份路径检测相关的计算属性
const backupSettings = computed(() => {
  const savedSettings = storage.load<AppSettings>('appSettings', null)
  return savedSettings?.backup || {
    autoBackup: true,
    folderPath: '',
    maxBackups: 10,
    retentionDays: 30
  }
})

const hasBackupPath = computed(() => {
  // 优先使用本地设置的路径，如果没有则使用存储的设置
  const path = localBackupPath.value || backupSettings.value.folderPath
  return path && path.trim() !== ''
})

const showBackupWarning = computed(() => {
  return createBackup.value && !hasBackupPath.value
})

// 备份路径选择功能
const selectBackupPath = async (): Promise<boolean> => {
  if (window.electronAPI && window.electronAPI.selectBackupFolder) {
    try {
      const result = await window.electronAPI.selectBackupFolder()
      if (result.success && result.data) {
        // 更新备份设置
        const currentSettings = storage.load<AppSettings>('appSettings', null) || { backup: {}, general: {}, bookApi: {}, blog: {} }
        currentSettings.backup = {
          ...currentSettings.backup,
          folderPath: result.data.folderPath
        }
        storage.save('appSettings', currentSettings)
        
        // 立即更新本地状态，确保响应式更新
        localBackupPath.value = result.data.folderPath
        
        message.success('备份文件夹设置成功')
        return true
      } else if (result.error && !result.error.includes('用户取消')) {
        message.error('选择文件夹失败: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('调用selectBackupFolder出错:', error)
      message.error('调用文件夹选择失败')
      return false
    }
  } else {
    message.error('当前环境不支持文件夹选择功能')
    return false
  }
  return false
}

// 过滤差异列表，移除空的差异描述
const filteredDifferences = computed(() => {
  return (props.compareResult.differences || []).filter(diff => {
    const description = formatDifference(diff)
    return description && description.trim() !== ''
  })
})

const getDiffTagType = (type: string): "default" | "primary" | "info" | "success" | "warning" | "error" => {
  switch (type) {
    case 'added': return 'success'
    case 'removed': return 'error'
    case 'modified': return 'warning'
    case 'reordered': return 'info'
    case 'structure_changed': return 'primary'
    default: return 'default'
  }
}

const getDiffTypeText = (type: string): string => {
  switch (type) {
    case 'added': return '新增'
    case 'removed': return '删除'
    case 'modified': return '修改'
    case 'reordered': return '重排'
    case 'structure_changed': return '结构'
    default: return '未知'
  }
}

const formatDifference = (diff: any): string => {
  if (diff.description) {
    return diff.description
  }
  
  switch (diff.type) {
    case 'added':
      return diff.field === 'book' ? 
        `新增书籍：${diff.bookTitle}` : 
        `新增${diff.field}: ${diff.newValue}`
    case 'removed':
      return diff.field === 'book' ? 
        `删除书籍：${diff.bookTitle}` : 
        `删除${diff.field}: ${diff.oldValue}`
    case 'modified':
      // 过滤掉ISBN和空值差异
      if (diff.field === 'isbn') {
        return '' // 不显示ISBN差异
      }
      
      // 过滤掉空值与空字符串的差异
      const oldVal = diff.oldValue || ''
      const newVal = diff.newValue || ''
      if (oldVal === newVal) {
        return '' // 不显示无意义的差异
      }
      
      return diff.field === 'book' ? 
        `修改书籍：${diff.bookTitle}` : 
        `修改${diff.bookTitle}的${diff.field}`
    case 'reordered':
      return '书籍排序发生变化'
    case 'structure_changed':
      return diff.description || `${diff.field}发生变化`
    default:
      return `${diff.field}发生变化`
  }
}

const handleConfirm = async () => {
  if (!selectedResolution.value) {
    message.warning('请选择一个解决方案')
    return
  }

  // 如果勾选了创建备份但没有设置备份路径，先提醒用户设置
  if (createBackup.value && !hasBackupPath.value) {
    const userChoice = await new Promise<'setup' | 'skip' | 'cancel'>((resolve) => {
      const d = dialog.create({
        title: '需要设置备份路径',
        content: '您选择了在覆盖前创建备份文件，但尚未设置备份文件夹路径。请选择一个操作：',
        positiveText: '立即设置备份路径',
        negativeText: '跳过备份继续',
        onPositiveClick: () => {
          resolve('setup')
        },
        onNegativeClick: () => {
          resolve('skip')
        },
        onClose: () => {
          resolve('cancel')
        }
      })
    })
    
    if (userChoice === 'cancel') {
      return
    }
    
    if (userChoice === 'setup') {
      const setupSuccess = await selectBackupPath()
      if (!setupSuccess) {
        // 用户取消了设置或设置失败，询问是否跳过备份继续
        const skipChoice = await new Promise<boolean>((resolve) => {
          const d = dialog.create({
            title: '设置失败',
            content: '备份路径设置未成功。是否跳过备份继续执行版本冲突解决？',
            positiveText: '跳过备份继续',
            negativeText: '取消',
            onPositiveClick: () => {
              resolve(true)
            },
            onNegativeClick: () => {
              resolve(false)
            },
            onClose: () => {
              resolve(false)
            }
          })
        })
        
        if (!skipChoice) {
          return
        }
        
        // 用户选择跳过备份，将createBackup设置为false
        createBackup.value = false
      }
    } else if (userChoice === 'skip') {
      // 用户选择跳过备份，将createBackup设置为false
      createBackup.value = false
    }
  }

  processing.value = true
  
  try {
    const resolution: ConflictResolution = {
      action: selectedResolution.value,
      createBackup: createBackup.value
    }
    
    const success = await versionSyncManager.resolveConflict(resolution)
    
    if (success) {
      console.log('🔧 版本冲突解决成功')
      message.success('版本冲突已解决')
      emit('resolved', true)
    } else {
      console.error('🔧 版本冲突解决失败')
      message.error('解决冲突失败，请查看控制台了解详细错误信息')
      emit('resolved', false)
    }
  } catch (error) {
    console.error('🔧 解决冲突过程出错:', error)
    
    // 提供更详细的错误信息
    let errorMessage = '解决冲突时发生错误'
    if (error instanceof Error) {
      const errorMsg = error.message
      
      if (errorMsg.includes('路径') || errorMsg.includes('ENOENT')) {
        errorMessage = '文件路径错误，请检查博客文件路径是否正确'
      } else if (errorMsg.includes('权限') || errorMsg.includes('EACCES')) {
        errorMessage = '文件权限不足，请检查文件权限设置'
      } else if (errorMsg.includes('空间') || errorMsg.includes('ENOSPC')) {
        errorMessage = '磁盘空间不足，请清理磁盘空间后重试'
      } else if (errorMsg.includes('API') || errorMsg.includes('Electron')) {
        errorMessage = '系统API不可用，请重启应用后重试'
      } else if (errorMsg.includes('备份')) {
        errorMessage = '备份创建失败，请检查备份文件夹设置'
      } else if (errorMsg.includes('验证')) {
        errorMessage = '文件结构验证失败，请检查原始文件结构'
      } else {
        errorMessage = `解决冲突失败：${errorMsg}`
      }
    }
    
    message.error(errorMessage)
    emit('resolved', false)
  } finally {
    processing.value = false
    showModal.value = false
  }
}

const handleCancel = () => {
  showModal.value = false
  emit('resolved', false)
}
</script>

<style scoped>
.conflict-dialog {
  padding: 4px 0;
}

.version-comparison {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.version-item {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.version-title {
  font-weight: 600;
  font-size: 14px;
}

.version-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 600;
}

.version-divider {
  display: flex;
  align-items: center;
  width: 60px;
  flex-shrink: 0;
}

.resolution-options {
  margin-bottom: 20px;
}

.option-content {
  margin-left: 8px;
}

.option-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.option-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.differences-section {
  margin-bottom: 20px;
}

.differences-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.difference-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.difference-item:last-child {
  border-bottom: none;
}

.diff-description {
  font-size: 13px;
  color: #333;
  flex: 1;
}

.more-differences {
  text-align: center;
  padding: 8px 0;
}

.backup-option {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .version-comparison {
    flex-direction: column;
    gap: 16px;
  }
  
  .version-divider {
    width: 100%;
    justify-content: center;
  }
  
  .version-item {
    width: 100%;
  }
}
</style>