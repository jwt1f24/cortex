import mammoth from "mammoth";
import { getDocumentProxy, extractText as extractPdfText } from "unpdf";

export async function extractText(file: File): Promise<string> {
    switch (file.type) {
        case "text/plain":
        case "text/markdown":
            return await file.text()

        case "application/pdf": {
            const buffer = Buffer.from(await file.arrayBuffer());
            const pdf = await getDocumentProxy(new Uint8Array(buffer));
            const { text } = await extractPdfText(pdf);
            return Array.isArray(text) ? text.join("\n") : text;
        }
        
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
            const buffer = Buffer.from(await file.arrayBuffer());
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }

        default:
            throw new Error(`Unsupported file type: ${file.type}`)
    }
}