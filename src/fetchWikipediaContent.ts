import { Static, Type } from "@sinclair/typebox"
import { FastifyInstance, FastifySchema, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RouteHandlerMethod } from "fastify";
import { WikipediaContentFetcher } from "./WikipediaContentFetcher";

const PageRequest = Type.Object({
    pageTitle: Type.String(),
    responseType: Type.String({ enum: ['html', 'markdown'], default: 'html' }),
    responseAsBlob: Type.Boolean({ default: false }),
});
type PageRequestType = Static<typeof PageRequest>

const PageSuccessResponse = Type.String();

const PageErrorResponse = Type.Object({
    code: Type.String(),
    info: Type.String(),
    "*": Type.String()
});

const PageHandlerSchema: FastifySchema = {
    description: 'Fetch page content from ja.wikipedia.org',
    operationId: 'fetchWikipediaContent',
    body: PageRequest,
    response: {
        200: {
            description: 'Successful response',
            content: {
                'text/markdown': {
                    schema: PageSuccessResponse,
                },
                'text/html': {
                    schema: PageSuccessResponse,
                },
                'application/octet-stream': {
                    'x-is-file': true,
                    schema: {
                        type: 'string',
                        format: 'binary'
                    }
                },
            },
        },
        404: {
            description: 'Page not found',
            content: {
                'application/json': {
                    schema: PageErrorResponse,
                },
            },
        },
        500: {
            description: 'Internal server error',
            content: {
                'application/json': {
                    schema: PageErrorResponse,
                },
            },
        },
    },
}

type PageHandlerType = {
    Body: PageRequestType;
}

const fetchWikipediaContentHandler: RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    PageHandlerType
> = async (request, reply) => {
    if (request.body.responseAsBlob) {
        const encodedPageTitle = encodeURIComponent(request.body.pageTitle);
        const extension = request.body.responseType == "markdown" ? "md" : "html";
        reply.header('Content-Disposition', `attachment; filename="${encodedPageTitle}.${extension}"`);
        reply.type('application/octet-stream').code(200);
    } else if (request.body.responseType == "markdown") {
        reply.type('text/markdown').code(200);
    } else {
        reply.type('text/html').code(200);
    }

    const content = await WikipediaContentFetcher(request.body.pageTitle, request.body.responseType == "markdown");

    if (content.code == "missingtitle") {
        reply.code(404).send(content["*"]);
        return;
    }

    if (content.code != "success") {
        reply.code(500).send(content);
        return;
    }

    reply.send(content["*"]);
}

export const fetchWikipediaContentHandlerRoutes = async (server: FastifyInstance) => {
    server.post<PageHandlerType>('/page', { schema: PageHandlerSchema }, fetchWikipediaContentHandler);
}