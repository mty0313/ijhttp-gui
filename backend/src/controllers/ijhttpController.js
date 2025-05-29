// ijhttpController.js
const { runIjhttp } = require('../services/ijhttp');

/**
 * fastify 路由处理函数，调用 ijhttp
 * POST /api/ijhttp
 * body: { fileIds: number[], options?: object }
 */
async function ijhttpHandler(request, reply) {
    const { fileIds, options = {} } = request.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return reply.code(400).send({
            error: 'fileIds 必须是非空数组'
        });
    }

    try {
        const result = await runIjhttp(fileIds, options);
        return reply.send(result);
    } catch (error) {
        return reply.code(500).send({
            error: error.message
        });
    }
}

module.exports = { ijhttpHandler };
