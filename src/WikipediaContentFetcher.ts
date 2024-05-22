import axios from "axios";
import { FastifyInstance, FastifySchema, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RouteHandlerMethod, RouteShorthandOptions } from "fastify";
import { Static, Type } from "@sinclair/typebox"
import TurndownService from "turndown";
import cheerio from 'cheerio';

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
    return { code: 'success', info: '', '*': response.data.parse.text['*'] };
};

// HTMLからstyleタグを削除する関数
const removeStyleTags: (html: string) => string = (html) => {
    const $ = cheerio.load(html);
    $('style').remove(); // styleタグを削除
    return $.html();
}

// HTMLをMarkdownに変換する関数
const convertHTMLToMarkdown: (html: string) => string = (html) => {
    const turndownService = new TurndownService();
    const htmlWithoutStyle = removeStyleTags(html);
    const markdown = turndownService.turndown(htmlWithoutStyle);
    return markdown;
}

const PageRequest = Type.Object({
    pageTitle: Type.String(),
    responseType: Type.String({ enum: ['html', 'markdown'], default: 'html' })
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
                'text/plain': {
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

    if (request.body.responseType == "markdown") {
        reply.send(convertHTMLToMarkdown(content["*"]));
        return;
    }

    reply.send(content["*"]);
}

export const WikipediaContentFetcherRoutes = async (server: FastifyInstance) => {
    server.post<PageHandlerType>('/page', { schema: PageHandlerSchema }, fetchWikipediaContentHandler);
}