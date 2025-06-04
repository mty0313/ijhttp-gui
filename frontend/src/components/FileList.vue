<template>
  <div class="file-list">
    <div class="header">
      <button @click="$emit('add')">新建</button>
    </div>
    <div class="content">
      <ul class="tabs">
        <li
          v-for="(file, idx) in files"
          :key="file.id || idx"
          :class="{ selected: idx === selected }"
          @click="$emit('select', idx)"
          style="display: flex; align-items: center; justify-content: space-between;"
        >
          <template v-if="editing === idx">
            <input
              v-model="inputName"
              @keydown.enter="save"
              @keydown.esc="cancel"
              @blur="cancel"
            />
          </template>
          <template v-else>
            <span class="file-name" :title="file.name">{{ file.name }}</span>
            <span v-if="isDirty && idx === selected" class="dirty-dot"></span>
            <span style="display: flex; gap: 0; margin-left: auto;">
              <button @click.stop="$emit('edit', idx)" class="edit-button">
                <img :src="editIcon" alt="编辑" />
              </button>
              <button @click.stop="onDelete(idx)" class="delete-button" title="删除">
                <img :src="deleteIcon" alt="删除" />
              </button>
            </span>
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import editIcon from '../assets/edit.svg';
import deleteIcon from '../assets/delete.svg';
import { httpFilesAPI } from '../remotes/ijhttp-api';

const props = defineProps({
  files: {
    type: Array,
    required: true
  },
  fileId: {
    type: Number,
    required: true
  },
  selected: Number,
  editing: Number,
  editingName: String,
  isDirty: Boolean // 新增
});

const emit = defineEmits(["add", "select", "edit", "save-name", "delete"]);

const inputName = ref("");
watch([
  () => props.editing,
  () => props.editingName
], ([newEditing, newEditingName]) => {
  inputName.value = newEditingName;
});

const save = async (e) => {
  try {
    if (props.editing >= 0) {
      const fileId = props.files[props.editing]?.id;
      await httpFilesAPI.updateHttpFile(fileId, inputName.value);
      emit("save-name", props.editing, inputName.value);
    }
  } catch (error) {
    console.error('Failed to update file name:', error);
  }
};

const cancel = () => emit("edit", -1);

const onDelete = async (idx) => {
  const file = props.files[idx];
  if (!file) return;
  if (confirm(`确定要删除文件 "${file.name}" 吗？`)) {
    try {
      await httpFilesAPI.deleteHttpFile(file.id);
      emit('delete', idx);
    } catch (e) {
      alert('删除失败');
      console.error(e);
    }
  }
};
</script>

<style scoped>
.file-list {
  width: 240px;
  border-right: 1px solid #e5e7eb;
  background: #f9fafb;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.file-list .header {
  padding: 12px 10px 8px 10px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.file-list > .header > button {
  width: 100%;
  padding: 8px 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #2563eb;
  cursor: pointer;
  border-radius: 6px;
  font-size: 1em;
  font-weight: 500;
  transition: background 0.15s, border 0.15s;
}

.file-list > .header > button:hover {
  background: #f3f6fa;
  border-color: #b6d4fe;
}

.file-list .content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 0 0;
}

.file-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tabs {
  border-bottom: none;
  margin-bottom: 0;
}

.file-list li {
  padding: 0 14px;
  height: 38px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0;
  border: none;
  background: none;
  color: #222;
  font-size: 0.9em;
  font-weight: 500;
  transition: background 0.13s, color 0.13s;
  gap: 8px;
  position: relative;
  margin-bottom: 0;
}

.file-list li.selected {
  background: #e8f0fe;
  color: #2563eb;
}

.file-list li:hover {
  background: #f3f6fa;
  color: #2563eb;
}

.file-list .file-name {
  flex: 1 1 0%;
  min-width: 0;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1em;
  font-weight: 500;
  color: inherit;
  transition: color 0.2s;
  margin-right: 0;
}

.file-list li.selected .file-name,
.file-list li:hover .file-name {
  color: #2563eb;
}

.file-list li button {
  opacity: 0;
  transition: opacity 0.2s;
  background: none;
  border: none;
  margin-left: 2px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 4px;
}

.file-list li.selected button,
.file-list li:hover button {
  opacity: 1;
}

.file-list li button.edit-button:hover {
  background: #e8f0fe;
}

.file-list li button.delete-button:hover {
  background: #ffeaea;
}

.file-list li button img {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.file-list li button:hover img {
  opacity: 1;
}

.file-list li > .edit-button,
.file-list li > .delete-button {
  margin-left: 8px;
}

.file-list input {
  width: 100%;
  padding: 4px 8px;
  background: #f3f6fa;
  border: 1px solid #e5e7eb;
  color: #222;
  border-radius: 4px;
  font-size: 1em;
  font-weight: 500;
}

.dirty-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #e74c3c;
  border-radius: 50%;
  margin-left: 6px;
  vertical-align: middle;
}
</style>
