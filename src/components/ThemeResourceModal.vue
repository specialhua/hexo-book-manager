<template>
  <n-modal 
    v-model:show="show" 
    preset="dialog" 
    title="另存CSS和JS" 
    style="width: 90vw; max-width: 1200px;"
    :mask-closable="false"
  >
    <!-- 顶部提示信息 -->
    <n-alert type="info" style="margin-bottom: 20px;" :show-icon="false">
      <template #header>
        <n-icon size="16" style="margin-right: 6px;">
          <InfoIcon />
        </n-icon>
        使用说明
      </template>
      <p style="margin: 8px 0; font-size: 14px; line-height: 1.6;">
        <strong>CSS内容片段</strong>：请将CSS内容添加到Fluid主题的 
        <n-code>/source/css/custom.css</n-code> 文件中<br/>
        <strong>JS内容片段</strong>：请将JS文件保存到Fluid主题的 
        <n-code>/source/js/</n-code> 目录中，然后在index.md底部引入
      </p>
    </n-alert>

    <!-- 资源列表 -->
    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane 
        v-for="resource in resources" 
        :key="resource.filename"
        :name="resource.filename" 
        :tab="resource.name"
      >
        <!-- 资源信息卡片 -->
        <n-card 
          size="small" 
          style="margin-bottom: 16px;" 
          :bordered="false"
          embedded
        >
          <n-space align="center" justify="space-between">
            <div>
              <n-text strong>{{ resource.name }}</n-text>
              <br/>
              <n-text depth="3" style="font-size: 13px;">
                {{ resource.description }}
              </n-text>
            </div>
            <n-space>
              <n-button 
                type="primary" 
                size="small"
                ghost
                @click="copyToClipboard(resource)"
                :loading="copyingIndex === resources.indexOf(resource)"
              >
                <template #icon>
                  <n-icon><CopyIcon /></n-icon>
                </template>
                复制
              </n-button>
              <n-button 
                type="primary" 
                size="small"
                @click="saveToFile(resource)"
                :loading="savingIndex === resources.indexOf(resource)"
              >
                <template #icon>
                  <n-icon><DownloadIcon /></n-icon>
                </template>
                另存
              </n-button>
            </n-space>
          </n-space>
        </n-card>

        <!-- 代码展示区域 -->
        <n-card 
          size="small"
          style="max-height: 60vh; overflow: hidden;"
          :bordered="false"
          embedded
        >
          <div 
            class="code-container"
            style="max-height: 55vh; overflow-y: auto; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;"
          >
            <pre 
              style="margin: 0; padding: 16px; background: #f8f9fa; border-radius: 4px; font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;"
            >{{ resource.content }}</pre>
          </div>
        </n-card>

        <!-- 使用说明 -->
        <n-alert 
          type="default" 
          style="margin-top: 16px;" 
          :show-icon="false"
        >
          <template #header>
            <n-icon size="14" style="margin-right: 4px;">
              <InfoIcon />
            </n-icon>
            使用方法
          </template>
          <n-text style="font-size: 13px;">{{ resource.usage }}</n-text>
        </n-alert>
      </n-tab-pane>
    </n-tabs>
    
    <template #action>
      <n-button @click="show = false">关闭</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage } from 'naive-ui'
import { getThemeResources, type ThemeResource } from '../assets/theme-resources'
import { CopyIcon } from './Icons'

// 定义props
interface Props {
  show: boolean
}

// 定义emits
interface Emits {
  (e: 'update:show', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const message = useMessage()
const activeTab = ref('custom.css')
const copyingIndex = ref(-1)
const savingIndex = ref(-1)

// 获取主题资源
const resources = getThemeResources()

// 图标组件
const InfoIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
  })
])

const DownloadIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'
  })
])

// 复制到剪贴板
const copyToClipboard = async (resource: ThemeResource) => {
  const index = resources.indexOf(resource)
  copyingIndex.value = index
  
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(resource.content)
      message.success(`${resource.name} 已复制到剪贴板`)
    } else {
      // 兼容性回退方案
      const textArea = document.createElement('textarea')
      textArea.value = resource.content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        message.success(`${resource.name} 已复制到剪贴板`)
      } catch (err) {
        console.error('复制失败:', err)
        message.error('复制失败，请手动选择复制')
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (error) {
    console.error('复制到剪贴板失败:', error)
    message.error('复制失败，请手动选择复制')
  } finally {
    copyingIndex.value = -1
  }
}

// 保存到文件
const saveToFile = async (resource: ThemeResource) => {
  const index = resources.indexOf(resource)
  savingIndex.value = index
  
  try {
    // 检查是否在Electron环境中
    if (window.electronAPI && window.electronAPI.saveThemeFile) {
      // Electron环境：使用系统文件保存对话框
      const result = await window.electronAPI.saveThemeFile({
        filename: resource.filename,
        content: resource.content,
        type: resource.type
      })
      
      if (result.success) {
        message.success(`${resource.name} 已保存到: ${result.data?.filePath}`)
      } else if (result.error && !result.error.includes('用户取消')) {
        message.error(`保存失败: ${result.error}`)
      }
    } else {
      // Web环境：使用浏览器下载
      const blob = new Blob([resource.content], { 
        type: resource.type === 'css' ? 'text/css' : 'text/javascript' 
      })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = resource.filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      message.success(`${resource.name} 已开始下载`)
    }
  } catch (error) {
    console.error('保存文件失败:', error)
    message.error('保存文件失败')
  } finally {
    savingIndex.value = -1
  }
}
</script>

<style scoped>
.code-container {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #ffffff;
}

.code-container pre {
  margin: 0;
  color: #2d3748;
}

/* 暗黑模式适配 */
:deep(.n-card.n-card--embedded) {
  background-color: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .code-container {
  border-color: #4a5568;
  background: #2d3748;
}

[data-theme="dark"] .code-container pre {
  color: #e2e8f0;
}

/* 滚动条样式 */
.code-container::-webkit-scrollbar {
  width: 8px;
}

.code-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.code-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.code-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

[data-theme="dark"] .code-container::-webkit-scrollbar-track {
  background: #1a202c;
}

[data-theme="dark"] .code-container::-webkit-scrollbar-thumb {
  background: #4a5568;
}

[data-theme="dark"] .code-container::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style>