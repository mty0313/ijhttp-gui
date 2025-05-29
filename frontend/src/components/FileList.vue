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
        >
          <template v-if="editing === idx">
            <input
              v-model="inputName"
              @keydown.enter="save"
              @keydown.esc="cancel"
            />
          </template>
          <template v-else>
            <span>{{ file.name }}</span>
            <span v-if="isDirty && idx === selected" class="dirty-dot"></span>
            <button @click.stop="$emit('edit', idx)" class="edit-button">
              <img :src="editIcon" alt="编辑" />
            </button>
            <button @click.stop="onDelete(idx)" class="delete-button" title="删除">
              <img :src="deleteIcon" alt="删除" />
            </button>
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
  border-right: 1px solid #e0e0e0;
  background: #f5f5f5;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.file-list .header {
  padding: 10px;
  position: sticky;
  top: 0;
  background: #f5f5f5;
  z-index: 2;
}

.file-list .content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.file-list > .header > button {
  width: 100%;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9em;
}

.file-list > .header > button:hover {
  background: #f8f8f8;
  border-color: #ccc;
}

.file-list li button {
  padding: 2px 6px;
  background: transparent;
  border: none;
  color: #999;
  opacity: 0;
  transition: opacity 0.2s;
}

.file-list li:hover button {
  opacity: 1;
}

.file-list li button:hover {
  color: #333;
  background: #f0f0f0;
}

.file-list li button.edit-button {
  padding: 4px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.file-list li button.edit-button:hover {
  background: #eee;
}

.file-list li button.edit-button img {
  width: 14px;
  height: 14px;
  opacity: 0.6;
}

.file-list li button.edit-button:hover img {
  opacity: 1;
}

.file-list li button.delete-button {
  padding: 4px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-left: 2px;
}

.file-list li button.delete-button:hover {
  background: #ffeaea;
}

.file-list li button.delete-button img {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.file-list li button.delete-button:hover img {
  opacity: 1;
}

.file-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tabs {
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 10px !important;
}

.file-list li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 4px 4px 0 0;
  margin-bottom: -1px;
  position: relative;
  color: #333;
}

.file-list li:hover {
  background: #ffffff;
  border-color: #e0e0e0;
}

.file-list li.selected {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-bottom-color: #ffffff;
  z-index: 1;
}

.file-list input {
  width: 100%;
  padding: 4px;
  background: #2d2d2d;
  border: 1px solid #444;
  color: #fff;
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
