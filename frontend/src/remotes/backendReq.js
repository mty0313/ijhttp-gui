import axios from 'axios'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 5000
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
  queryFiles() {
    return request.post('/ijhttp/files/query')
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

  updateHttpFile(id, fileName, content) {
    return request.put(`/ijhttp/files/update`, { id, fileName, content })
  }
}