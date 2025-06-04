const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const db = require('./db');
const { httpFileUtil } = require('../utils/httpFileUtil');
const url = require('url');

/**
 * 为 http 文件内容的每个请求自动添加 >> /tmp/response/xxx.json，并返回 response 路径信息
 * @param {string} fileContent
 * @param {string} tempDir
 * @param {number} fileId
 * @param {string} fileName
 * @returns {{ content: string, responsePaths: Array<{remark: string, responsePath: string, fileId: number}> }}
 */
function addResponsePathToRequests(fileContent, tempDir, fileId, fileName) {
    // 如果最后一行不是空行，则添加一个空行
    if (!/\r?\n$/.test(fileContent)) {
        fileContent += '\n';
    }
    const requests = httpFileUtil.splitHttpRequests(fileContent);
    const lines = fileContent.split(/\r?\n/);
    let remarkMap = new Map();
    let lastRemark = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('###')) {
            lastRemark = line.replace(/^###\s*/, '').trim();
        }
        if (/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE)\b/.test(line)) {
            remarkMap.set(i + 1, lastRemark);
        }
    }
    let newLines = lines.slice();
    let offset = 0;
    const responsePaths = [];
    for (let i = 0; i < requests.length; i++) {
        const req = requests[i];
        let remark = remarkMap.get(req.startLine) || '';
        let firstLine = req.raw.split(/\r?\n/)[0];
        let baseUrl = '';
        const urlMatch = firstLine.match(/https?:\/\/([^\s/]+)/);
        if (urlMatch) baseUrl = urlMatch[1];
        const timestamp = Date.now();
        let name = `${timestamp}-${(remark || baseUrl || 'response')}`;
        let respDisplayName = (remark || baseUrl) || `${timestamp}`
        name = name.replace(/[^a-zA-Z0-9-_]/g, '_');
        const responsePath = path.join(__dirname, '../tmp/response', `${name}-${fileId}.json`);
        // 检查请求块内是否已有 >>
        const reqLines = newLines.slice(req.startLine - 1 + offset, req.endLine + offset);
        if (!reqLines.some(l => />>\s*\S+/.test(l))) {
            newLines.splice(req.endLine + offset, 0, `>> ${responsePath}`);
            offset++;
            // 如果是最后一个请求，且不是文件最后一行，再插入一个空行
            if (i === requests.length - 1 && (req.endLine + offset < newLines.length)) {
                newLines.splice(req.endLine + offset, 0, '');
                offset++;
            }
        }
        responsePaths.push({ remark: name, responsePath, fileId, respDisplayName });
    }
    return { content: newLines.join('\n'), responsePaths };
}

/**
 * 从数据库读取HTTP文件内容并执行
 * @param {number|number[]} fileIds - 需要执行的HTTP文件ID或ID数组
 * @param {object} [options] - 其他可选参数，如 { envName, reportPath, logLevel, envFile, privateEnvFile, extraArgs }
 * @returns {Promise<{ code: number, stdout: string, stderr: string, responses: Array<{remark: string, responsePath: string, response: string}> }>} 进程执行结果
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
    let allResponsePaths = [];

    try {
        // 只处理每个文件内容，添加 >> 路径后写入临时文件，并收集 response 路径
        for (const file of files) {
            const { content: newContent, responsePaths } = addResponsePathToRequests(file.content, tempDir, file.id, file.filename);
            const tempPath = path.join(tempDir, `${file.id}-${file.filename}.http`);
            await fs.writeFile(tempPath, newContent);
            tempFiles.push({ tempPath, fileId: file.id });
            allResponsePaths.push(...responsePaths);
        }

        // 准备 ijhttp 命令参数
        const args = [];
        if (options.envName) args.push('-e', options.envName);
        if (options.reportPath) args.push('-r', options.reportPath);
        if (options.logLevel) args.push('-L', options.logLevel);
        if (options.envFile) args.push('-v', options.envFile);
        if (options.privateEnvFile) args.push('-p', options.privateEnvFile);
        if (options.extraArgs && Array.isArray(options.extraArgs)) args.push(...options.extraArgs);
        args.push(...tempFiles.map(f => f.tempPath));

        // 执行 ijhttp 命令
        const result = await new Promise((resolve, reject) => {
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

        // 直接读取所有 response 路径
        const responses = [];
        for (const rp of allResponsePaths) {
            let resp = null;
            try {
                resp = await fs.readFile(rp.responsePath, 'utf-8');
            } catch (e) {
                resp = null;
            }
            responses.push({
                // remark: rp.remark,
                respDisplayName: rp.respDisplayName,
                // responsePath: rp.responsePath,
                response: resp
            });
        }

        return { ...result, responses };
    } finally {
        // 清理临时文件和目录
        try {
            for (const f of tempFiles) {
                await fs.unlink(f.tempPath).catch(() => { });
            }
            // 清理所有 response json 文件
            for (const rp of allResponsePaths) {
                await fs.unlink(rp.responsePath).catch(() => { });
            }
            await fs.rmdir(tempDir);
        } catch (err) {
            console.error('清理临时文件时出错:', err);
        }
    }
}

module.exports = { runIjhttp };