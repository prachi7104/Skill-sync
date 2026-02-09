declare module "mammoth" {
    interface ExtractResult {
        value: string;
        messages: Array<{ type: string; message: string }>;
    }

    interface InputOptions {
        buffer?: Buffer;
        arrayBuffer?: ArrayBuffer;
        path?: string;
    }

    function extractRawText(options: InputOptions): Promise<ExtractResult>;
    function convertToHtml(options: InputOptions): Promise<ExtractResult>;

    const mammoth: {
        extractRawText: typeof extractRawText;
        convertToHtml: typeof convertToHtml;
    };

    export = mammoth;
}
