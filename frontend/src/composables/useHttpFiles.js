import { ref } from 'vue'
import { httpFilesAPI } from '../remotes/ijhttp-api'

const files = ref([])
const fileContents = ref([])
const fileIds = ref([])
const selectedIdx = ref(0)
const isDirty = ref(false)
const editingIdx = ref(-1)
const editingName = ref('')

export default function useHttpFiles() {
  const fetchFiles = async () => {
    const response = await httpFilesAPI.queryFiles(1, 1000)
    const list = response.data || []
    files.value = list.map(f => ({ id: f.id, name: f.filename }))
    fileContents.value = list.map(f => f.content)
    fileIds.value = list.map(f => f.id)
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
  }

  const selectFile = (idx) => {
    selectedIdx.value = idx;
    isDirty.value = false; // 切换文件时重置未保存状态
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
  }

  const saveCurrentFile = async () => {
    if (!isDirty.value) return
    await httpFilesAPI.updateHttpFile(files.value[selectedIdx.value].id, undefined, fileContents.value[selectedIdx.value])
    isDirty.value = false
  }

  const executeRequest = async () => {
    if (isDirty.value) await saveCurrentFile()
    const result = await httpFilesAPI.executeHttpFiles(files.value[selectedIdx.value].id, { logLevel: 'VERBOSE' })
    console.log('执行结果:', result)
  }

  const getEditorContent = () => fileContents.value[selectedIdx.value]

  return {
    files, fileContents, fileIds, selectedIdx, isDirty,
    editingIdx, editingName,
    fetchFiles, addNewFile, startEdit, saveFileName,
    selectFile, onEdit, saveCurrentFile, executeRequest
  }
}
