// ijhttpController.js
const { runIjhttp } = require('../services/ijhttp');

/**
 * fastify 路由处理函数，调用 ijhttp
 * POST /api/ijhttp
 * body: { files: string[], options?: object }
 */
async function ijhttpHandler(request, reply) {
    // 支持 multipart/form-data 文件上传
    if (request.isMultipart && request.isMultipart()) {
        const files = await request.saveRequestFiles();
        if (!files || files.length === 0) {
            reply.code(400);
            return { error: '未上传文件' };
        }
        // 只取 fieldName 为 files 的文件
        const httpFiles = files.filter(f => f.fieldname === 'files');
        if (httpFiles.length === 0) {
            reply.code(400);
            return { error: 'files 参数不能为空' };
        }
        const filePaths = httpFiles.map(f => f.filepath);
        try {
            const result = await runIjhttp(filePaths, {});
            // 可选：删除临时文件
            httpFiles.forEach(f => { try { require('fs').unlinkSync(f.filepath); } catch(e){} });
            return result;
        } catch (err) {
            reply.code(500);
            return { error: err.message };
        }
    }
    // 兼容原有 JSON body 方式
    const { files, options } = request.body || {};
    if (!files || !Array.isArray(files) || files.length === 0) {
        reply.code(400);
        return { error: 'files 参数不能为空' };
    }
    try {
        const result = await runIjhttp(files, options);
        return result;
    } catch (err) {
        reply.code(500);
        return { error: err.message };
    }
}

module.exports = { ijhttpHandler };
