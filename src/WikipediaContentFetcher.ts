import axios from "axios";
import { FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RouteHandlerMethod, RouteShorthandOptions } from "fastify";
import { Static, Type } from "@sinclair/typebox"

type ResponseType = {
    code: string,
    info: string,
    "*": string
}

const fetchWikipediaContent: (pageTitle: string) => Promise<ResponseType> = async (pageTitle: string) => {
    const url = 'https://ja.wikipedia.org/w/api.php';
    const params = {
        origin: '*',
        action: 'parse',
        format: 'json',
        page: pageTitle,
        prop: 'text',
        contentmodel: 'wikitext'
    };
    const response = await axios.get(url, { params: params });

    if (response.status != 200) {
        console.error('Error A:', response.status, response.statusText, response.data);
        throw response.data;
    }
    if (response.data.error) {
        if (response.data.error.code == 'missingtitle') {
            console.error('Error B:', response.data.error.code, response.data.error.info, response.data.error['*'])
            return response.data.error as ResponseType;
        }
        console.error('Error C:', response.data.error.code, response.data.error.info, response.data.error['*'])
        throw response.data.error as ResponseType;
    }
    return {code: 'success', info: '', '*': response.data.parse.text['*']};
};

const PageRequest = Type.Object({
    pageTitle: Type.String()
});
type PageRequestType = Static<typeof PageRequest>

const PageSuccessResponse = Type.Object({
    content: Type.String()
});
type PageSuccessResponseType = Static<typeof PageSuccessResponse>

const PageErrorResponse = Type.Object({
    code: Type.String(),
    info: Type.String(),
    "*": Type.String()
});
type PageErrorResponseType = Static<typeof PageErrorResponse>

const PageHandlerSchema = {
    schema: {
        description: 'Fetch page content from ja.wikipedia.org',
        operationId: 'fetchWikipediaContent',
        body: PageRequest,
        response: {
            200: PageSuccessResponse,
            404: PageErrorResponse,
            500: PageErrorResponse,
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
    reply.type('application/json').code(200);

    const content = await fetchWikipediaContent(request.body.pageTitle);

    if (content.code == "missingtitle") {
        reply.code(404).send(content["*"]);
        return;
    }

    return {content: content["*"]};
}

export const WikipediaContentFetcherRoutes = async (server: FastifyInstance) => {
    server.post<PageHandlerType>('/page', PageHandlerSchema, fetchWikipediaContentHandler);
}