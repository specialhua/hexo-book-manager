<template>
  <div class="version-check-control">
    <!-- 版本检查按钮 -->
    <n-button 
      @click="manualCheckVersions" 
      :loading="checkingVersions" 
      :disabled="!hasBlogConfig"
    >
      <template #icon>
        <n-icon><SyncIcon /></n-icon>
      </template>
      版本检查
    </n-button>
    
    <!-- 版本状态标签 -->
    <n-tag :type="versionStatusDisplay.type" size="small">
      {{ versionStatusDisplay.text }}
    </n-tag>
    
    <!-- 版本冲突对话框 -->
    <VersionConflictDialog
      v-model:show="showVersionConflict"
      v-if="versionConflictData"
      :compare-result="versionConflictData"
      @resolved="handleVersionConflictResolved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NIcon, NTag } from 'naive-ui'
import { SyncIcon } from './Icons'
import VersionConflictDialog from './VersionConflictDialog.vue'
import type { VersionCompareResult } from '../utils/versionSync'
import type { VersionStatus } from '../composables/useVersionCheck'

// Props
interface Props {
  checkingVersions: boolean
  hasBlogConfig: boolean
  versionStatusDisplay: {
    text: string
    type: 'default' | 'success' | 'warning' | 'info'
  }
  versionConflictData: VersionCompareResult | null
  showVersionConflict: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'manual-check': []
  'conflict-resolved': [success: boolean]
  'update:showVersionConflict': [value: boolean]
}>()

// 手动检查版本
const manualCheckVersions = () => {
  emit('manual-check')
}

// 处理版本冲突解决
const handleVersionConflictResolved = (success: boolean) => {
  emit('conflict-resolved', success)
}

// 双向绑定 showVersionConflict
const showVersionConflict = computed({
  get: () => props.showVersionConflict,
  set: (value: boolean) => emit('update:showVersionConflict', value)
})
</script>

<style scoped>
.version-check-control {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>