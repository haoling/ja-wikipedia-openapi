import axios from "axios";

type ResponseType = {
    code: "success" | "error",
    content: any,
}

export const WikipediaPageSearcher: (searchTerm: string) => Promise<ResponseType> = async (searchTerm) => {
    const url = 'https://ja.wikipedia.org/w/api.php';
    const params = {
        origin: '*',
        action: 'query',
        list: 'search',
        format: 'json',
        srsearch: searchTerm,
    };
    console.log('searchTerm:', searchTerm);
    console.log('params:', params);
    const response = await axios.get(url, { params: params });

    if (response.status != 200) {
        console.error('Error A:', response.status, response.statusText, response.data);
        return {code:"error", content: response.data};
    }
    if (response.data.error) {
        console.error('Error B:', response.data.error.code, response.data.error.info, response.data.error['*'])
        return {code:"error", content: response.data.error};
    }

    return {code:"success", content: response.data};
};
