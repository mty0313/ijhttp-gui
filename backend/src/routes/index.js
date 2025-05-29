const db = require('../services/db');
const { ijhttpHandler } = require('../controllers/ijhttpController');
const { ijhttpFilesQueryHandler, ijhttpFilesCreateHandler, ijhttpFilesUpdateHandler } = require('../controllers/ijhttpFilesController');

function setRoutes(fastify) {
    // ping
    fastify.get('/ping', async (request, reply) => {
        return 'pong';
    });

    // 调用 ijhttp 的接口
    fastify.post('/api/ijhttp/execute', ijhttpHandler);

    // 处理文件查询接口
    fastify.post('/api/ijhttp/files/query', ijhttpFilesQueryHandler);

    // 处理文件创建接口
    fastify.post('/api/ijhttp/files/create', ijhttpFilesCreateHandler);

    // 处理文件更新接口
    fastify.post('/api/ijhttp/files/update', ijhttpFilesUpdateHandler);
}

module.exports = setRoutes;