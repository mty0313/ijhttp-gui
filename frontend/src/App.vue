<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { httpFilesAPI } from "./remotes/ijhttp-api";
import * as monaco from "monaco-editor";
import "./monaco/http"; // 导入 HTTP 语言支持

const httpFiles = ref([]);
const fileIds = ref([]); // 存储文件ID
const selectedIdx = ref(0);
const fileContent = ref("");
const fileContents = ref([]);
const editorRef = ref(null);
let monacoEditor = null;
const isDirty = ref(false); // 标记文件是否有未保存的更改

const isEditing = ref(-1);
const editingName = ref("");

// 添加新文件
const addNewFile = async () => {
  // 创建新文件
  try {
    const result = await httpFilesAPI.createHttpFile("新建请求文件", "");
    
    // 更新本地数据
    httpFiles.value.unshift(result.filename);
    fileContents.value.unshift(result.content);
    fileIds.value.unshift(result.id);
    
    // 更新选中状态
    selectedIdx.value = 0;
    
    // 设置为编辑状态
    isEditing.value = 0;
    editingName.value = result.filename;
    
    // 更新编辑器内容
    if (monacoEditor) {
      monacoEditor.setValue("");
      isDirty.value = false;
    }
  } catch (error) {
    console.error("Failed to create new file:", error);
  }
};

const startEdit = (idx, event) => {
  event.stopPropagation();
  isEditing.value = idx;
  editingName.value = httpFiles.value[idx];
};

const saveFileName = async (idx, event) => {
  event.stopPropagation();
  const oldName = httpFiles.value[idx];
  const newName = editingName.value.trim();

  if (newName && newName !== oldName) {
    try {
      const id = fileIds.value[idx];
      if (!id) {
        throw new Error("File ID not found");
      }
      // 只更新文件名
      await httpFilesAPI.updateHttpFile(id, newName);
      httpFiles.value[idx] = newName;
    } catch (error) {
      console.error("Failed to rename file:", error);
      // 恢复原名
      httpFiles.value[idx] = oldName;
    }
  }
  isEditing.value = -1;
};

const handleKeyDown = (idx, event) => {
  if (event.key === "Enter") {
    saveFileName(idx, event);
  } else if (event.key === "Escape") {
    isEditing.value = -1;
    editingName.value = httpFiles.value[idx];
  }
};

const fetchFiles = async () => {
  try {
    const response = await httpFilesAPI.queryFiles();
    const files = response.data || [];
    httpFiles.value = files.map((file) => file.filename);
    fileContents.value = files.map((file) => file.content);
    fileIds.value = files.map((file) => file.id);
  } catch (error) {
    console.error("Failed to fetch files:", error);
  }
};

const selectFile = (idx) => {
  // 检查当前文件是否有未保存的更改
  if (isDirty.value) {
    // 这里可以添加提示，询问用户是否保存更改
    console.warn('有未保存的更改');
  }
  selectedIdx.value = idx;
  if (monacoEditor) {
    monacoEditor.setValue(fileContents.value[idx] || "");
    isDirty.value = false; // 重置dirty状态
  }
};

const onEdit = () => {
  if (monacoEditor) {
    fileContents.value[selectedIdx.value] = monacoEditor.getValue();
    isDirty.value = true;
  }
};

const saveCurrentFile = async () => {
  if (!monacoEditor || !isDirty.value) return;

  try {
    const currentId = fileIds.value[selectedIdx.value];
    if (!currentId) {
      throw new Error("File ID not found");
    }

    const content = monacoEditor.getValue();
    await httpFilesAPI.updateHttpFile(currentId, undefined, content);
    isDirty.value = false;
  } catch (error) {
    console.error("Failed to save file:", error);
  }
};

const executeRequest = async () => {
  if (!monacoEditor || selectedIdx.value === undefined) return;

  // 如果有未保存的更改，先保存
  if (isDirty.value) {
    await saveCurrentFile();
  }

  try {
    const currentId = fileIds.value[selectedIdx.value];
    if (!currentId) {
      throw new Error("无效的文件ID");
    }

    // 调用 API 执行 HTTP 请求
    const result = await httpFilesAPI.executeHttpFiles(currentId, {
      // 这里可以添加其他选项
      logLevel: 'debug'
    });

    // TODO: 在界面上展示执行结果
    console.log("请求执行结果:", result);
  } catch (error) {
    console.error("执行请求失败:", error);
    // TODO: 在界面上显示错误信息
  }
};

onMounted(async () => {
  await fetchFiles();

  // 初始化 Monaco Editor
  monacoEditor = monaco.editor.create(editorRef.value, {
    value: fileContents.value[selectedIdx.value] || "",
    language: "http",
    theme: "vs-light",
    fontSize: 14,
    fontFamily: "'Fira Code', 'Source Code Pro', Consolas, monospace",
    minimap: { enabled: true },
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    renderWhitespace: "boundary",
    rulers: [80, 120],
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    // HTTP 文件特定配置
    formatOnType: true,
    formatOnPaste: true,
    snippetSuggestions: "top",
    suggest: {
      showKeywords: true,
    },
  });

  // 监听编辑器内容变化
  monacoEditor.onDidChangeModelContent(() => {
    onEdit();
  });

  // 添加保存快捷键
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    saveCurrentFile();
  });
});

onBeforeUnmount(() => {
  if (monacoEditor) {
    monacoEditor.dispose();
  }
});

watch(selectedIdx, (newIdx) => {
  if (monacoEditor) {
    monacoEditor.setValue(fileContents.value[newIdx] || "");
  }
});
</script>

<template>
  <div class="main-layout">
    <div class="tabbar">
      <div class="tabbar-title">ijhttp-gui</div>
      <div class="tabbar-right">
        <button 
          class="save-button" 
          @click="saveCurrentFile" 
          :disabled="!isDirty" 
          :class="{ 'button-disabled': !isDirty }"
          title="保存 (⌘S)"
        >
          保存
        </button>
        <button class="execute-button" @click="executeRequest" title="执行请求">
          <span class="execute-icon">▶</span>
          执行
        </button>
      </div>
    </div>
    <div class="container">
      <div class="sidebar">
        <div class="sidebar-header">
          <button class="add-file-button" @click="addNewFile" title="新建请求文件">
            <span class="add-icon">+</span>
            新建
          </button>
        </div>
        <ul>
          <li
            v-for="(file, idx) in httpFiles"
            :key="file"
            :class="{ active: idx === selectedIdx }"
            @click="selectFile(idx)"
          >
            <div v-if="isEditing === idx" class="filename-editor" @click.stop>
              <input
                v-model="editingName"
                type="text"
                @blur="saveFileName(idx, $event)"
                @keydown="handleKeyDown(idx, $event)"
                ref="fileNameInput"
                :class="{ 'filename-input': true }"
              />
            </div>
            <div v-else class="filename-display">
              <div class="filename-info">
                <span 
                  class="dirty-indicator"
                  :class="{ 'is-dirty': idx === selectedIdx && isDirty }"
                  title="有未保存的更改"
                ></span>
                <span>{{ file }}</span>
              </div>
              <button
                class="edit-button"
                @click="startEdit(idx, $event)"
                title="编辑文件名"
              >
                重命名
              </button>
            </div>
          </li>
        </ul>
      </div>
      <div class="editor">
        <div ref="editorRef" class="monaco-editor"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 禁止页面整体滚动 */
}
.tabbar {
  width: 100%;
  height: 54px;
  background: #fff;
  border-bottom: 1.5px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  box-sizing: border-box;
  font-size: 1.18em;
  font-weight: 600;
  letter-spacing: 1px;
  z-index: 10;
  box-shadow: 0 2px 8px 0 #f0f1f3;
}
.tabbar-title {
  color: #1677ff;
  font-weight: bold;
  font-size: 1.18em;
}
.tabbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.container {
  flex: 1 1 0;
  display: flex;
  height: 100%; /* 让container始终填满剩余空间 */
  background: #f3f4f8;
  align-items: stretch;
  overflow: hidden; /* 禁止内容区整体滚动 */
}
.sidebar {
  width: 18vw;
  min-width: 120px;
  max-width: 260px;
  background: #f8fafc;
  border-right: 1.5px solid #e0e0e0;
  box-shadow: 2px 0 8px 0 #f0f1f3;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%; /* 让sidebar始终与container等高 */
  overflow: hidden; /* 防止整个侧边栏滚动 */
}

.sidebar-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1.5px solid #e0e0e0;
  display: flex;
  justify-content: center;
}

.add-file-button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-file-button:hover {
  background: #0958d9;
}

.add-file-button:active {
  transform: scale(0.98);
}

.add-icon {
  font-size: 16px;
  font-weight: 600;
}

.sidebar ul {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  overflow-y: auto; /* 只允许列表部分滚动 */
  min-height: 0; /* 关键：允许flex child收缩并启用滚动 */
}
.sidebar li {
  padding: 18px 24px;
  cursor: pointer;
  border-bottom: 1px solid #f0f1f3;
  transition: background 0.18s, color 0.18s;
  font-size: 1.08em;
  color: #333;
  background: none;
}
.sidebar li.active {
  background: #e6f2ff;
  color: #1677ff;
  font-weight: 600;
}
.sidebar li:hover {
  background: #f0f7ff;
  color: #1677ff;
}
.editor {
  flex: 1 1 0;
  padding: 24px;
  background: #f3f4f8;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.monaco-editor {
  width: 100%;
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}

.editor-toolbar {
  padding: 0 0 12px 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.execute-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #1677ff;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.execute-button:hover {
  background: #0958d9;
}

.execute-button:active {
  transform: scale(0.98);
}

.execute-icon {
  font-size: 12px;
}

.save-button {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid #1677ff;
  border-radius: 4px;
  background: white;
  color: #1677ff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button:hover:not(.button-disabled) {
  background: #f0f7ff;
}

.save-button:active:not(.button-disabled) {
  transform: scale(0.98);
}

.button-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #d9d9d9;
  color: #d9d9d9;
}

textarea {
  display: none;
}

.filename-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.filename-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dirty-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.3s ease;
}

.dirty-indicator.is-dirty {
  background: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

.edit-button {
  opacity: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #1677ff;
  font-size: 14px;
  padding: 4px 8px;
  transition: opacity 0.2s;
}

.sidebar li:hover .edit-button {
  opacity: 1;
}

.filename-editor {
  width: 100%;
}

.filename-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #1677ff;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  background: white;
}

.filename-input:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}
</style>
