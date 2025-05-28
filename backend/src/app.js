const fastify = require('fastify')({ logger: true });
const setRoutes = require('./routes/index');

fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/multipart'));

// 如果 setRoutes 期望的是 app/express 实例，需要适配为 fastify
setRoutes(fastify);

const PORT = process.env.PORT || 5000;

fastify.listen({ port: PORT }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`Server is running on ${address}`);
});