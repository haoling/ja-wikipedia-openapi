import axios from "axios";
import { RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RequestGenericInterface, RouteHandlerMethod } from "fastify";

export const fetchWikipediaContent = async (pageTitle: string) => {
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

export const fetchWikipediaContentHandler: RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    {
        Body: {
            pageTitle: string;
        }
    }
> = async (request, reply) => {
    reply.type('application/json').code(200);

    const content = await fetchWikipediaContent(request.body.pageTitle);

    return {content};
}