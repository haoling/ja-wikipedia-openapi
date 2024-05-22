import fastify from 'fastify'
import { WikipediaContentFetcherRoutes } from './WikipediaContentFetcher';
import fastifySwagger from '@fastify/swagger';
import { OpenAPIV3 } from 'openapi-types';

const serverUri = process.env.SERVER_URI || "http://localhost:3000";

const server = fastify({
    logger: true
})

server.get('/', async () => {
    return { hello: 'world' }
});

const openApiV3Document: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
        title: "ja-wikipedia",
        description: "Fetch page content from ja.wikipedia.org",
        version: "0.1.1",
    },
    servers: [
        {
            url: serverUri,
        },
    ],
    paths: {}
}
server.register(fastifySwagger, {
    openapi: openApiV3Document,
});
server.register(require("@fastify/swagger-ui"), {
    routePrefix: "/doc",
    uiConfig: {
        docExpansion: "full",
        deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header: any) => header,
    exposeRoute: true,
})

server.register(WikipediaContentFetcherRoutes, { prefix: 'wikipedia' });

server.put('/some-route/:id', {
    schema: {
        description: 'put me some data',
        tags: ['user', 'code'],
        summary: 'qwerty',
        security: [{ apiKey: [] }]
    }
}, (req, reply) => { });

server.listen(
    {
        host: '0.0.0.0',
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
