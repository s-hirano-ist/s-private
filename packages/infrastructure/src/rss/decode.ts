import { MIMEType } from "node:util";

/** RFC 7303: BOM, HTTP charset, XML declaration, then UTF-8. Never replace invalid bytes. */
export function decodeFeedXml(bytes: Uint8Array, contentType?: string): string {
	const input = Buffer.from(bytes);
	const bom = byteOrderEncoding(input);
	const header = httpCharset(contentType);
	const signature = utf16Signature(input);
	const prolog = input.subarray(0, 1024).toString("latin1");
	const declaration =
		/^<\?xml\s[^?]*\bencoding\s*=\s*(["'])([a-z][\w.-]*)\1/iu.exec(prolog)?.[2];
	const encoding = bom ?? header ?? signature ?? declaration ?? "utf-8";
	return new TextDecoder(encoding, { fatal: true }).decode(input);
}
function httpCharset(contentType?: string): string | undefined {
	if (!contentType) return undefined;
	try {
		return new MIMEType(contentType).params.get("charset")?.trim() || undefined;
	} catch {
		return undefined;
	}
}
function byteOrderEncoding(bytes: Uint8Array): string | undefined {
	const prefix = Buffer.from(bytes.subarray(0, 4)).toString("hex");
	if (["0000feff", "fffe0000"].includes(prefix))
		throw new RangeError("Unsupported XML charset");
	if (prefix.startsWith("efbbbf")) return "utf-8";
	if (prefix.startsWith("feff")) return "utf-16be";
	if (prefix.startsWith("fffe")) return "utf-16le";
	return undefined;
}
function utf16Signature(bytes: Uint8Array): string | undefined {
	const prefix = Buffer.from(bytes.subarray(0, 4)).toString("hex");
	if (prefix === "003c003f") return "utf-16be";
	if (prefix === "3c003f00") return "utf-16le";
	return undefined;
}
