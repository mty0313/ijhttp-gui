<template>
  <div ref="editorContainer" class="editor"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref } from "vue";
import * as monaco from "monaco-editor";
import "../monaco/http";

const props = defineProps(["content", "isDirty"]);
const emit = defineEmits(["change", "save", "execute"]);

const editorContainer = ref(null);
let editorInstance;
let isSettingValue = false; // 新增flag

onMounted(() => {
  editorInstance = monaco.editor.create(editorContainer.value, {
    value: props.content,
    language: "http",
    automaticLayout: true,
    theme: "vs",
  });

  editorInstance.onDidChangeModelContent(() => {
    if (!isSettingValue) {
      emit("change", editorInstance.getValue());
    }
  });

  window.addEventListener("keydown", handleKey);
});

onBeforeUnmount(() => {
  if (editorInstance) editorInstance.dispose();
  window.removeEventListener("keydown", handleKey);
});

watch(
  () => props.content,
  (val) => {
    if (editorInstance && editorInstance.getValue() !== val) {
      isSettingValue = true;
      editorInstance.setValue(val);
      isSettingValue = false;
    }
  }
);

function handleKey(e) {
  if (e.metaKey && e.key === "s") {
    e.preventDefault();
    emit("save");
  } else if (e.metaKey && e.key === "Enter") {
    e.preventDefault();
    emit("execute");
  }
}
</script>

<style scoped>
.editor {
  flex: 1;
  height: 100%;
  overflow: hidden;
}
</style>