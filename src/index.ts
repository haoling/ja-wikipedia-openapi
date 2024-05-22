import fastify from 'fastify'
import { fetchWikipediaContentHandler } from './WikipediaContentFetcher';
const server = fastify({
    logger: true
})

server.post('/', fetchWikipediaContentHandler);

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
