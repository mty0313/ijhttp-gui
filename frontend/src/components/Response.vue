<template>
  <div class="response-panel" v-if="responses && responses.length">
    <div class="response-title">
      返回结果
      <span v-if="fileName" class="response-filename">
        ({{ fileName }})
      </span>
    </div>
    <div class="response-list">
      <div v-for="(resp, idx) in responses" :key="idx" class="response-item">
        <div class="response-name">{{ resp.respDisplayName }}</div>
        <pre class="response-body">{{ formatResponse(resp.response) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  responses: {
    type: Array,
    default: () => []
  },
  fileName: {
    type: String,
    default: ''
  }
});

function formatResponse(val) {
  if (!val) return '';
  try {
    // 尝试格式化 JSON
    return JSON.stringify(JSON.parse(val), null, 2);
  } catch {
    return val;
  }
}
</script>

<style scoped>
.response-panel {
  background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%);
  border-top: 2px solid #6366f1;
  box-shadow: 0 4px 16px rgba(99,102,241,0.08);
  padding: 0 20px 18px 20px;
  max-height: 320px;
  overflow-y: auto;
  animation: fadeIn 0.3s;
  border-radius: 0 0 14px 14px;
}
.response-title {
  font-weight: 700;
  color: #4338ca;
  margin: 18px 0 12px 0;
  font-size: 18px;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
}
.response-filename {
  font-weight: normal;
  color: #6366f1;
  font-size: 15px;
  margin-left: 10px;
  background: #eef2ff;
  border-radius: 4px;
  padding: 2px 8px;
}
.response-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.response-item {
  background: #fff;
  border: 1.5px solid #6366f1;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(99,102,241,0.06);
  transition: box-shadow 0.2s;
}
.response-item:hover {
  box-shadow: 0 4px 16px rgba(99,102,241,0.13);
}
.response-name {
  font-size: 14px;
  color: #6366f1;
  margin-bottom: 6px;
  font-weight: 600;
}
.response-body {
  font-size: 14px;
  color: #222;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  background: #f1f5fd;
  border-radius: 6px;
  padding: 8px 10px;
  border: 1px solid #e0e7ff;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
</style>
