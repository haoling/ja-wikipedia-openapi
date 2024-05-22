import fastify from 'fastify'
import { WikipediaContentFetcherRoutes } from './WikipediaContentFetcher';
const server = fastify({
    logger: true
})

server.register(require("@fastify/swagger"))
server.register(require("@fastify/swagger-ui"), {
  routePrefix: "/doc",
  staticCSP: true,
  transformSpecificationClone: true,
})

server.register(WikipediaContentFetcherRoutes, { prefix: 'wikipedia'});

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
