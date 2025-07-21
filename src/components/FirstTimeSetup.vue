<template>
  <n-modal 
    v-model:show="showModal" 
    preset="card"
    title="欢迎使用书籍管理器"
    :closable="false"
    :mask-closable="false"
    style="width: 680px;"
  >
    <div class="first-time-setup">
      <div class="welcome-content">
        <div class="welcome-header">
          <n-icon size="48">
            <BookIcon />
          </n-icon>
          <h2>设置您的博客路径</h2>
          <p class="subtitle">
            为了提供更好的体验，我们建议您设置博客中的index.md文件路径。
            这样可以实现缓存数据与博客文件的自动同步。
          </p>
        </div>

        <div class="features-list">
          <div class="feature-item">
            <n-icon size="20" class="success-icon">
              <CheckIcon />
            </n-icon>
            <div class="feature-content">
              <div class="feature-title">版本同步</div>
              <div class="feature-description">自动检测缓存与博客文件的版本差异</div>
            </div>
          </div>
          
          <div class="feature-item">
            <n-icon size="20" class="success-icon">
              <CheckIcon />
            </n-icon>
            <div class="feature-content">
              <div class="feature-title">冲突解决</div>
              <div class="feature-description">智能提示并帮助您解决版本冲突</div>
            </div>
          </div>
          
          <div class="feature-item">
            <n-icon size="20" class="success-icon">
              <CheckIcon />
            </n-icon>
            <div class="feature-content">
              <div class="feature-title">自动备份</div>
              <div class="feature-description">修改前自动创建备份，保护您的数据</div>
            </div>
          </div>
        </div>

        <div class="setup-options">
          <n-radio-group v-model:value="setupChoice" name="setup">
            <n-space vertical>
              <n-radio value="setup_now">
                <div class="option-content">
                  <div class="option-title">
                    <n-icon size="16">
                      <FolderIcon />
                    </n-icon>
                    立即设置博客路径
                  </div>
                  <div class="option-description">
                    推荐选择，选择您博客中的index.md文件，启用所有同步功能
                  </div>
                </div>
              </n-radio>
              
              <n-radio value="skip_for_now">
                <div class="option-content">
                  <div class="option-title">
                    <n-icon size="16" class="warning-icon">
                      <SkipIcon />
                    </n-icon>
                    暂时跳过
                  </div>
                  <div class="option-description">
                    继续使用当前的缓存模式，您可以稍后在设置中配置
                  </div>
                </div>
              </n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <div v-if="setupChoice === 'setup_now'" class="blog-path-setup">
          <n-card size="small" style="margin-top: 12px;">
            <template #header>
              <n-text depth="2" style="font-size: 14px;">博客路径设置</n-text>
            </template>
            
            <div class="path-input-section">
              <n-input
                v-model:value="blogPath"
                placeholder="请选择您博客中的index.md文件"
                readonly
                style="margin-bottom: 12px;"
              >
                <template #suffix>
                  <n-button 
                    text 
                    size="small" 
                    @click="selectBlogPath"
                    :loading="selecting"
                  >
                    <n-icon size="16">
                      <FolderIcon />
                    </n-icon>
                    选择文件
                  </n-button>
                </template>
              </n-input>
              
              <n-text depth="3" style="font-size: 12px;">
                请选择您Hexo博客中的index.md文件，通常位于博客根目录的某个页面文件夹中
              </n-text>
            </div>

            <div v-if="blogPath" class="path-preview">
              <n-alert type="success" style="margin-top: 12px;">
                <template #header>
                  <n-icon size="16" style="margin-right: 6px;">
                    <CheckIcon />
                  </n-icon>
                  文件路径已设置
                </template>
                <div class="path-display">
                  <n-text code>{{ blogPath }}</n-text>
                </div>
              </n-alert>
            </div>
          </n-card>
        </div>

        <div class="setup-tips">
          <n-alert type="info" style="margin-top: 20px;">
            <template #header>
              <n-icon size="16" style="margin-right: 6px;">
                <InfoIcon />
              </n-icon>
              提示
            </template>
            <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
              <li>设置博客路径后，每次启动时会自动检查版本同步</li>
              <li>您可以随时在设置中修改或清除博客路径</li>
              <li>跳过设置不会影响应用的正常使用</li>
            </ul>
          </n-alert>
        </div>
      </div>
    </div>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleCancel">
          取消
        </n-button>
        <n-button 
          type="primary" 
          :disabled="setupChoice === 'setup_now' && !blogPath"
          :loading="processing"
          @click="handleConfirm"
        >
          {{ setupChoice === 'setup_now' ? '完成设置' : '确认跳过' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { 
  NModal, 
  NIcon, 
  NRadioGroup, 
  NRadio, 
  NSpace, 
  NButton,
  NInput,
  NText,
  NAlert,
  NCard,
  useMessage
} from 'naive-ui'
import { versionSyncManager } from '../utils/versionSync'

// 图标组件
const BookIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z'
  })
])

const CheckIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z'
  })
])

const FolderIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'
  })
])

const SkipIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z'
  })
])

const InfoIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
  })
])

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'completed': [blogPath: string | null]
}>()

const message = useMessage()

const showModal = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

const setupChoice = ref<'setup_now' | 'skip_for_now'>('setup_now')
const blogPath = ref<string>('')
const selecting = ref(false)
const processing = ref(false)

const selectBlogPath = async () => {
  if (!window.electronAPI?.selectMdFile) {
    message.error('此功能需要在Electron环境中使用')
    return
  }

  selecting.value = true
  
  try {
    const result = await window.electronAPI.selectMdFile()
    if (result.success && result.data) {
      blogPath.value = result.data.filePath
      message.success('博客路径设置成功')
    } else {
      console.log('用户取消选择')
    }
  } catch (error) {
    console.error('选择文件失败:', error)
    message.error('选择文件失败')
  } finally {
    selecting.value = false
  }
}

const handleConfirm = async () => {
  processing.value = true
  
  try {
    if (setupChoice.value === 'setup_now') {
      if (!blogPath.value) {
        message.warning('请选择博客文件路径')
        return
      }
      
      // 设置博客路径
      await versionSyncManager.setBlogPath(blogPath.value)
      message.success('博客路径设置完成')
      emit('completed', blogPath.value)
    } else {
      // 跳过设置
      emit('completed', null)
    }
  } catch (error) {
    console.error('设置失败:', error)
    message.error('设置失败: ' + (error as Error).message)
  } finally {
    processing.value = false
    showModal.value = false
  }
}

const handleCancel = () => {
  showModal.value = false
}
</script>

<style scoped>
.first-time-setup {
  padding: 8px 0;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-header {
  text-align: center;
  padding: 8px 0;
}

.welcome-header h2 {
  margin: 16px 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  /* 移除硬编码颜色，使用主题变量 */
}

.subtitle {
  margin: 0;
  /* 移除硬编码颜色，使用主题变量 */
  font-size: 14px;
  line-height: 1.5;
  max-width: 480px;
  margin: 0 auto;
  opacity: 0.8;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.feature-content {
  flex: 1;
}

.feature-title {
  font-weight: 600;
  font-size: 14px;
  /* 移除硬编码颜色，使用主题变量 */
  margin-bottom: 4px;
}

.feature-description {
  font-size: 13px;
  /* 移除硬编码颜色，使用主题变量 */
  opacity: 0.8;
  line-height: 1.4;
}

.setup-options {
  padding: 0 8px;
}

.option-content {
  margin-left: 8px;
}

.option-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.option-description {
  font-size: 12px;
  /* 移除硬编码颜色，使用主题变量 */
  opacity: 0.7;
  line-height: 1.4;
}

.blog-path-setup {
  /* 移除硬编码样式，使用NCard组件 */
}

.path-input-section {
  margin-bottom: 8px;
}

.path-preview {
  margin-top: 8px;
}

.path-display {
  margin-top: 8px;
}

/* 图标颜色类 - 使用CSS变量适配主题 */
.success-icon {
  color: var(--n-color-success);
}

.warning-icon {
  color: var(--n-color-warning);
}

.setup-tips {
  margin-top: 4px;
}

.setup-tips ul {
  list-style-type: disc;
}

.setup-tips li {
  margin-bottom: 4px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .features-list {
    padding: 0 8px;
  }
  
  .welcome-header h2 {
    font-size: 20px;
  }
  
  .subtitle {
    font-size: 13px;
  }
}
</style>