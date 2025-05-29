import axios from 'axios'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 60000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('Request failed:', error)
    return Promise.reject(error)
  }
)

// HTTP文件相关接口
export const httpFilesAPI = {
  /**
   * 获取所有HTTP文件列表
   * @returns {Promise<{total: number, data: Array<{id: number, filename: string, content: string}>, page: number, pageSize: number}>}
   */
  queryFiles(page, pageSize) {
    return request.post('/ijhttp/files/query', { page, pageSize })
  },

  /**
   * 创建新的HTTP文件
   * @param {string} fileName - 文件名
   * @param {string} content - 文件内容
   * @returns {Promise<{id: number, filename: string, content: string}>}
   */
  createHttpFile(fileName, content) {
    return request.post('/ijhttp/files/create', { fileName, content })
  },

  /**
   * 更新HTTP文件
   * @param {number} id - 文件ID（必传）
   * @param {string} [fileName] - 文件名（可选）
   * @param {string} [content] - 文件内容（可选）
   * @returns {Promise<{id: number, filename?: string, content?: string}>}
   */
  updateHttpFile(id, fileName, content) {
    const params = { id };
    if (fileName !== undefined) params.fileName = fileName;
    if (content !== undefined) params.content = content;
    return request.post(`/ijhttp/files/update`, params);
  },

  /**
   * 执行HTTP文件
   * @param {number|number[]} fileIds - 要执行的文件ID或ID数组
   * @param {object} [options] - 执行选项
   * @param {string} [options.envName] - 环境名称
   * @param {string} [options.reportPath] - 报告路径
   * @param {string} [options.logLevel] - 日志级别
   * @param {string} [options.envFile] - 环境变量文件路径
   * @param {string} [options.privateEnvFile] - 私有环境变量文件路径
   * @returns {Promise<{code: number, stdout: string, stderr: string}>}
   */
  executeHttpFiles(fileIds, options = {}) {
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];
    return request.post('/ijhttp/execute', { fileIds: ids, options });
  }
}