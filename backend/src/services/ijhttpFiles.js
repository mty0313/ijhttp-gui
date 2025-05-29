const db = require('./db');

class IjhttpFilesService {
  /**
   * 分页查询所有http文件
   */
  async queryFiles(page = 1, pageSize = 10) {
    // 获取总记录数
    const countResult = db.prepare('SELECT COUNT(*) as total FROM http_files').get();
    const total = countResult.total;

    // 计算偏移量
    const offset = (page - 1) * pageSize;

    // 查询数据
    const files = db.prepare('SELECT * FROM http_files ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(pageSize, offset);

    return {
      total,
      data: files,
      page,
      pageSize
    };
  }

  /**
   * 创建新的HTTP文件
   * @param {string} fileName - 文件名（必传）
   * @param {string} [content] - 文件内容（可选）
   * @returns {Promise<{id: number, filename: string, content: string}>}
   */
  async createHttpFile(fileName, content = '') {
    if (!fileName) {
      throw new Error('fileName is required');
    }

    const stmt = db.prepare('INSERT INTO http_files (filename, content) VALUES (?, ?)');
    const result = stmt.run(fileName, content);
    return {
      id: result.lastInsertRowid,
      filename: fileName,
      content: content
    };
  }

  /**
   * 更新HTTP文件
   * @param {number} id - 文件ID（必传）
   * @param {string} [fileName] - 文件名（可选）
   * @param {string} [content] - 文件内容（可选）
   * @returns {Promise<{id: number, filename?: string, content?: string}>}
   */
  async updateHttpFile(id, fileName, content) {
    if (!id) {
      throw new Error('File ID is required');
    }

    // 构建动态 UPDATE 语句和参数
    const updateFields = [];
    const params = [];
    
    if (fileName !== undefined) {
      updateFields.push('filename = ?');
      params.push(fileName);
    }
    
    if (content !== undefined) {
      updateFields.push('content = ?');
      params.push(content);
    }
    
    if (updateFields.length === 0) {
      throw new Error('At least one field (fileName or content) must be provided');
    }

    params.push(id); // 添加 WHERE 条件的参数
    
    const sql = `UPDATE http_files SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...params);

    // 获取更新后的文件信息
    const updatedFile = db.prepare('SELECT * FROM http_files WHERE id = ?').get(id);
    if (!updatedFile) {
      throw new Error('File not found');
    }

    return updatedFile;
  }
}

const ijhttpFilesService = new IjhttpFilesService();
module.exports = ijhttpFilesService;