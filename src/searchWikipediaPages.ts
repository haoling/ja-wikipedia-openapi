import { Static, Type } from "@sinclair/typebox"
import { FastifyInstance, FastifySchema, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RouteHandlerMethod } from "fastify";
import { WikipediaContentFetcher } from "./WikipediaContentFetcher";
import { WikipediaPageSearcher } from "./WikipediaPageSearcher";

const PageRequest = Type.Object({
    searchTerm: Type.String(),
});
type PageRequestType = Static<typeof PageRequest>

/*
{
    "batchcomplete": true,
    "continue": {
        "sroffset": 10,
        "continue": "-||"
    },
    "query": {
        "searchinfo": {
            "totalhits": 399
        },
        "search": [
            {
                "ns": 0,
                "title": "不知火フレア",
                "pageid": 4086749,
                "size": 25373,
                "wordcount": 2830,
                "snippet": "<span class=\"searchmatch\">れ</span>た。 ^ 夏色まつり、大神ミオ、<span class=\"searchmatch\">不知火</span>フレア ^ ロボ子さん、夜空メル、アキ・ローゼンタール、湊あく<span class=\"searchmatch\">あ</span>、<span class=\"searchmatch\">不知火</span>フレア ^ <span class=\"searchmatch\">不知火</span>フレア、天音かなた、常闇トワ ^ ロボ子さん、夜空メル、アキ・ローゼンタール、夏色まつり、湊あく<span class=\"searchmatch\">あ</span>、大神ミオ、さくらみこ、<span class=\"searchmatch\">不知火</span>フレア、常闇トワ ^",
                "timestamp": "2024-04-28T21:32:48Z"
            },
            ...
        ]
    }
}
*/
const PageSuccessResponseSearch = Type.Object({
    ns: Type.Number(),
    title: Type.String(),
    pageid: Type.Number(),
    size: Type.Number(),
    wordcount: Type.Number(),
    snippet: Type.String(),
    timestamp: Type.String(),
});
const PageSuccessResponse = Type.Object({
    batchcomplete: Type.Boolean(),
    continue: Type.Object({
        sroffset: Type.Number(),
        continue: Type.String(),
    }),
    query: Type.Object({
        searchinfo: Type.Object({
            totalhits: Type.Number(),
        }),
        search: Type.Array(PageSuccessResponseSearch),
    }),
});

const PageErrorResponse = Type.Any();

const PageHandlerSchema: FastifySchema = {
    description: 'Search page titles from ja.wikipedia.org',
    operationId: 'searchWikipediaPages',
    body: PageRequest,
    response: {
        200: {
            description: 'Successful response',
            content: {
                'application/json': {
                    schema: PageSuccessResponse,
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

const searchWikipediaPagesHandler: RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    PageHandlerType
> = async (request, reply) => {
    reply.type('application/json').code(200);

    const content = await WikipediaPageSearcher(request.body.searchTerm);
    console.log('content:', content);

    if (content.code != "success") {
        reply.code(500).send(content.content);
        return;
    }

    reply.send(content.content);
}

export const searchWikipediaPagesHandlerRoutes = async (server: FastifyInstance) => {
    server.post<PageHandlerType>('/search', { schema: PageHandlerSchema }, searchWikipediaPagesHandler);
}