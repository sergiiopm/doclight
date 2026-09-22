import { decodeTextBytes, encodeTextBytes, htmlToPlainText, plainTextToHtml } from "@/files/html";

export function bytesToHtmlFromTxt(bytes: Uint8Array): string {
  return plainTextToHtml(decodeTextBytes(bytes));
}

export function htmlToTxtBytes(html: string): Uint8Array {
  return encodeTextBytes(htmlToPlainText(html));
}
