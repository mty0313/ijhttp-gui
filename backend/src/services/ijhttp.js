const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const db = require('./db');

/**
 * 从数据库读取HTTP文件内容并执行
 * @param {number|number[]} fileIds - 需要执行的HTTP文件ID或ID数组
 * @param {object} [options] - 其他可选参数，如 { envName, reportPath, logLevel, envFile, privateEnvFile, extraArgs }
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>} 进程执行结果
 */
async function runIjhttp(fileIds, options = {}) {
    // 确保 fileIds 是数组
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];
    if (ids.length === 0) {
        throw new Error('fileIds 参数不能为空');
    }

    // 从数据库查询文件内容
    const stmt = db.prepare('SELECT id, filename, content FROM http_files WHERE id IN (' + ids.map(() => '?').join(',') + ')');
    const files = stmt.all(ids);
    
    if (files.length === 0) {
        throw new Error('未找到指定的HTTP文件');
    }

    // 创建临时文件
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ijhttp-'));
    const tempFiles = [];

    try {
        // 将内容写入临时文件
        for (const file of files) {
            const tempPath = path.join(tempDir, `${file.id}-${file.filename}.http`);
            await fs.writeFile(tempPath, file.content);
            tempFiles.push(tempPath);
        }

        // 准备 ijhttp 命令参数
        const args = [];
        if (options.envName) args.push('-e', options.envName);
        if (options.reportPath) args.push('-r', options.reportPath);
        if (options.logLevel) args.push('-L', options.logLevel);
        if (options.envFile) args.push('-v', options.envFile);
        if (options.privateEnvFile) args.push('-p', options.privateEnvFile);
        if (options.extraArgs && Array.isArray(options.extraArgs)) args.push(...options.extraArgs);
        args.push(...tempFiles);

        // 执行 ijhttp 命令
        return await new Promise((resolve, reject) => {
            const child = spawn('ijhttp', args, { shell: true });
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => { stdout += data.toString(); });
            child.stderr.on('data', (data) => { stderr += data.toString(); });
            
            child.on('close', (code) => {
                resolve({ code, stdout, stderr });
            });
            
            child.on('error', (err) => {
                reject(err);
            });
        });
    } finally {
        // 清理临时文件和目录
        try {
            for (const file of tempFiles) {
                await fs.unlink(file);
            }
            await fs.rmdir(tempDir);
        } catch (err) {
            console.error('清理临时文件时出错:', err);
        }
    }
}

module.exports = { runIjhttp };