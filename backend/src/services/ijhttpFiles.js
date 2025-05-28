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

  async createHttpFile(fileName, content) {
    const stmt = db.prepare('INSERT INTO http_files (filename, content) VALUES (?, ?)');
    const result = stmt.run(fileName, content);
    return {
      id: result.lastInsertRowid,
      filename: fileName,
      content: content
    };
  }

  async updateHttpFile(id, fileName, content) {
    const stmt = db.prepare('UPDATE http_files SET filename = ?, content = ? WHERE id = ?');
    stmt.run(fileName, content, id);
    return {
      id,
      filename: fileName,
      content: content
    };
  }
}

const ijhttpFilesService = new IjhttpFilesService();
module.exports = ijhttpFilesService;