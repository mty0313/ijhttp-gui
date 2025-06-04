import { ref } from 'vue'
import { httpFilesAPI } from '../remotes/ijhttp-api'

const files = ref([])
const fileContents = ref([])
const fileIds = ref([])
const selectedIdx = ref(0)
const isDirty = ref(false)
const editingIdx = ref(-1)
const editingName = ref('')
const fileDirtyMap = ref({});

export default function useHttpFiles() {
  const fetchFiles = async () => {
    const response = await httpFilesAPI.queryFiles(1, 1000)
    const list = response.data || []
    files.value = list.map(f => ({ id: f.id, name: f.filename }))
    fileContents.value = list.map(f => f.content)
    fileIds.value = list.map(f => f.id)
    // 初始化所有文件为未脏
    fileDirtyMap.value = {};
    files.value.forEach((_, idx) => { fileDirtyMap.value[idx] = false; });
  }

  const addNewFile = async () => {
    const result = await httpFilesAPI.createHttpFile('新建请求', '')
    files.value.unshift({ id: result.id, name: result.filename })
    fileContents.value.unshift(result.content)
    fileIds.value.unshift(result.id)
    selectedIdx.value = 0
    editingIdx.value = 0
    editingName.value = result.filename
    isDirty.value = false
    fileDirtyMap.value = { 0: false };
  }

  const selectFile = (idx) => {
    // 记录当前文件的脏状态
    if (selectedIdx.value >= 0) {
      fileDirtyMap.value[selectedIdx.value] = isDirty.value;
    }
    selectedIdx.value = idx;
    // 恢复切换到的文件的脏状态
    isDirty.value = !!fileDirtyMap.value[idx];
  }

  const startEdit = (idx) => {
    editingIdx.value = idx;
    // 立即用 files.value[idx].name 赋值
    editingName.value = files.value[idx].name;
    // 触发 nextTick，确保 FileList.vue 的 watch 能及时响应
    // 这样 inputName.value = editingName.value 会同步
  }

  const saveFileName = async (idx, newName) => {
    newName = newName.trim();
    if (newName && newName !== files.value[idx].name) {
      try {
        await httpFilesAPI.updateHttpFile(files.value[idx].id, newName);
        files.value[idx].name = newName; // 立即本地更新，确保 UI 响应
      } catch (e) {
        console.error('重命名失败', e);
      }
    }
    editingIdx.value = -1;
  }

  const onEdit = (val) => {
    fileContents.value[selectedIdx.value] = val;
    isDirty.value = true;
    fileDirtyMap.value[selectedIdx.value] = true;
  }

  const saveCurrentFile = async () => {
    if (!isDirty.value) return
    await httpFilesAPI.updateHttpFile(files.value[selectedIdx.value].id, undefined, fileContents.value[selectedIdx.value])
    isDirty.value = false
    fileDirtyMap.value[selectedIdx.value] = false;
  }

  const executeRequest = async () => {
    if (isDirty.value) await saveCurrentFile();
    const result = await httpFilesAPI.executeHttpFiles(files.value[selectedIdx.value].id, { logLevel: 'VERBOSE' });
    return result; // 返回后由App.vue处理
  }

  const onDeleteFile = (idx) => {
    files.value.splice(idx, 1);
    fileContents.value.splice(idx, 1);
    fileIds.value.splice(idx, 1);
    delete fileDirtyMap.value[idx];
    // 重新整理 fileDirtyMap 的 key
    const newMap = {};
    files.value.forEach((_, i) => { newMap[i] = !!fileDirtyMap.value[i]; });
    fileDirtyMap.value = newMap;
    if (selectedIdx.value >= files.value.length) {
      selectedIdx.value = files.value.length - 1;
    }
    if (selectedIdx.value < 0) {
      selectedIdx.value = 0;
    }
  }

  const getEditorContent = () => fileContents.value[selectedIdx.value]

  return {
    files, fileContents, fileIds, selectedIdx, isDirty,
    editingIdx, editingName,
    fetchFiles, addNewFile, startEdit, saveFileName,
    selectFile, onEdit, saveCurrentFile, executeRequest,
    onDeleteFile
  }
}
