import axios from "axios";
import { FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RouteHandlerMethod } from "fastify";
import { Static, Type } from "@sinclair/typebox"

const fetchWikipediaContent = async (pageTitle: string) => {
    const url = 'https://ja.wikipedia.org/w/api.php';
    const params = {
        origin: '*',
        action: 'parse',
        format: 'json',
        page: pageTitle,
        prop: 'text',
        contentmodel: 'wikitext'
    };
    const response = await axios.get(url, {params: params});

    if (response.status != 200) {
        throw response.data;
    }
    if (response.data.error) {
        throw response.data.error;
    }
    return response.data.parse.text['*'];
};

const PageRequest = Type.Object({
    pageTitle: Type.String()
});
type PageRequestType = Static<typeof PageRequest>

const PageResponse = Type.Object({
    content: Type.String()
});
type PageResponseType = Static<typeof PageResponse>

const PageHandlerSchema = {
    schema: {
        body: PageRequest,
        response: {
          200: PageResponse,
        },
      },
}

type PageHandlerType = {
    Body: PageRequestType;
    Reply: PageResponseType;
}

const fetchWikipediaContentHandler: RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    PageHandlerType
> = async (request, reply) => {
    reply.type('application/json').code(200);

    const content = await fetchWikipediaContent(request.body.pageTitle);

    return {content};
}

export const WikipediaContentFetcherRoutes = async (server: FastifyInstance) => {
    server.post<PageHandlerType>('/page', PageHandlerSchema, fetchWikipediaContentHandler);
}