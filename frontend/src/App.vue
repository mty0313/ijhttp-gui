<template>
  <div class="app">
    <div class="toolbar">
      <div class="left">ijhttp-gui</div>
      <div class="right">
        <button class="toolbar-btn" :class="{ dirty: isDirty }" @click="saveCurrentFile" :disabled="!isDirty">
          保存
        </button>
        <button class="toolbar-btn primary" @click="onExecuteClick" :disabled="executing">
          <span v-if="executing" class="loading-spinner"></span>
          <span v-else>执行</span>
        </button>
      </div>
    </div>
    <div class="main-content">
      <FileList
        :files="files"
        :selected="selectedIdx"
        :editing="editingIdx"
        :editingName="editingName"
        :isDirty="isDirty"
        @add="addNewFile"
        @select="selectFile"
        @edit="startEdit"
        @save-name="saveFileName"
        @delete="onDeleteFile"
      />
      <Editor
      :content="currentContent"
      :isDirty="isDirty"
      @change="onEdit"
      @save="saveCurrentFile"
      @execute="onExecuteClick"
    />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import FileList from "./components/FileList.vue";
import Editor from "./components/Editor.vue";
import useHttpFiles from "./composables/useHttpFiles";

const {
  files,
  fileContents,
  fileIds,
  selectedIdx,
  isDirty,
  editingIdx,
  editingName,
  fetchFiles,
  addNewFile,
  startEdit,
  saveFileName,
  selectFile,
  onEdit,
  saveCurrentFile,
  executeRequest,
} = useHttpFiles();

const currentContent = computed(
  () => fileContents.value[selectedIdx.value] || ""
);

const executing = ref(false);

async function onExecuteClick() {
  if (executing.value) return;
  executing.value = true;
  try {
    // 设置超时时间，例如30秒
    await Promise.race([
      executeRequest(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('执行超时')), 60000))
    ]);
  } catch (e) {
    // 可选：弹窗或提示错误
    console.error(e);
  } finally {
    executing.value = false;
  }
}

async function onDeleteFile(idx) {
  // 删除本地数据
  files.value.splice(idx, 1);
  fileContents.value.splice(idx, 1);
  fileIds.value.splice(idx, 1);
  // 处理选中项
  if (selectedIdx.value >= files.value.length) {
    selectedIdx.value = files.value.length - 1;
  }
  if (selectedIdx.value < 0) {
    selectedIdx.value = 0;
  }
}

onMounted(fetchFiles);
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #ffffff;
}

.toolbar {
  height: 40px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #f8f8f8;
  flex-shrink: 0;
}

.toolbar .left {
  font-weight: 500;
  color: #333;
}

.toolbar .right {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  padding: 4px 12px;
  height: 28px;
  font-size: 13px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.toolbar-btn:hover {
  background: #f0f0f0;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.dirty {
  border-color: #0066cc;
  color: #0066cc;
}

.toolbar-btn.primary {
  background: #0066cc;
  border-color: #0066cc;
  color: white;
}

.toolbar-btn.primary:hover {
  background: #0052a3;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top: 2px solid #0066cc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 4px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
