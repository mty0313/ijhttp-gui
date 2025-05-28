// 用于调用 ijhttp 命令行工具的方法
const { spawn } = require('child_process');

/**
 * 调用 ijhttp 工具执行 HTTP 文件
 * @param {string[]} files - 需要执行的 .http 文件路径数组
 * @param {object} [options] - 其他可选参数，如 { envName, reportPath, logLevel, envFile, privateEnvFile, extraArgs }
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>} 进程执行结果
 */
function runIjhttp(files, options = {}) {
    return new Promise((resolve, reject) => {
        if (!files || !Array.isArray(files) || files.length === 0) {
            return reject(new Error('files 参数不能为空'));
        }
        const args = [];
        if (options.envName) args.push('-e', options.envName);
        if (options.reportPath) args.push('-r', options.reportPath);
        if (options.logLevel) args.push('-L', options.logLevel);
        if (options.envFile) args.push('-v', options.envFile);
        if (options.privateEnvFile) args.push('-p', options.privateEnvFile);
        if (options.extraArgs && Array.isArray(options.extraArgs)) args.push(...options.extraArgs);
        args.push(...files);

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
}

module.exports = { runIjhttp };