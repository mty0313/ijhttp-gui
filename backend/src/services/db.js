// SQLite 数据库初始化和简单操作示例
const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件存放在 backend 目录下
const db = new Database(path.join(__dirname, '../..//db/data.db'));

// 初始化 http_files 表
db.exec(`
  CREATE TABLE IF NOT EXISTS http_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 添加触发器以自动更新 updated_at
db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_http_files_timestamp 
  AFTER UPDATE ON http_files
  BEGIN
    UPDATE http_files SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
  END;
`);

module.exports = db;
