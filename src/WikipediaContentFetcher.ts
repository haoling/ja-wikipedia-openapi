import axios from "axios";
import TurndownService from "turndown";
import cheerio from 'cheerio';

type ResponseType = {
    code: string,
    info: string,
    "*": string
}

export const WikipediaContentFetcher: (pageTitle: string, outputMarkdown: boolean) => Promise<ResponseType> = async (pageTitle, outputMarkdown) => {
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

    let text = response.data.parse.text['*'];
    if (outputMarkdown) {
        text = convertHTMLToMarkdown(text);
    }
    return { code: 'success', info: '', '*': text };
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
