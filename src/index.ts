import fastify from 'fastify'
const server = fastify({
    logger: true
})

server.get('/', async (request, reply) => {
    reply.type('application/json').code(200)
    return {hello: 'world'}
})

server.listen(
    {
        port: 3000,
    },
    (err, address) => {
        if (err) {
            server.log.error(err)
            process.exit(1)
        }
        server.log.info(`server listening on ${address}`)
    }
)
