const ijhttpFilesService = require('../services/ijhttpFiles');

async function ijhttpFilesQueryHandler(request, reply) {
    const { page = 1, pageSize = 10 } = request.query;

    try {
        const filesService = require('../services/ijhttpFiles');
        const result = await filesService.queryFiles(page, pageSize);
        return result;
    } catch (err) {
        reply.code(500);
        return { error: err.message };
    }
}

async function ijhttpFilesCreateHandler(request, reply) {
    try {
        const { fileName, content } = request.body;
        
        if (!fileName) {
            return reply.code(400).send({ 
                error: 'fileName is required' 
            });
        }

        const result = await ijhttpFilesService.createHttpFile(fileName, content);
        return reply.code(201).send(result);
    } catch (error) {
        console.error('Error creating http file:', error);
        return reply.code(500).send({ 
            error: 'Internal server error' 
        });
    }
}

async function ijhttpFilesUpdateHandler(request, reply) {
    try {
        const { id, fileName, content } = request.body;

        if (!id || (!fileName && !content)) {
            return reply.code(400).send({ 
                error: 'id and (fileName or content) are required' 
            });
        }

        const result = await ijhttpFilesService.updateHttpFile(id, fileName, content);
        return reply.code(200).send(result);
    } catch (error) {
        console.error('Error updating http file:', error);
        return reply.code(500).send({ 
            error: 'Internal server error' 
        });
    }
  }

module.exports = { ijhttpFilesQueryHandler, ijhttpFilesCreateHandler, ijhttpFilesUpdateHandler };