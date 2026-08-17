import { load } from "js-yaml";

export type ParsedMarkdownFrontmatter<
	Data extends Record<string, unknown> = Record<string, unknown>,
> = {
	content: string;
	data: Data;
};

const BYTE_ORDER_MARK = "\uFEFF";
const OPENING_DELIMITER_REGEX = /^---[\t ]*\r?\n/u;
const CLOSING_DELIMITER_REGEX = /^---[\t ]*\r?$/gmu;

function stripByteOrderMark(source: string): string {
	return source.startsWith(BYTE_ORDER_MARK) ? source.slice(1) : source;
}

function getContentStart(source: string, delimiterEnd: number): number {
	if (source.startsWith("\r\n", delimiterEnd)) {
		return delimiterEnd + 2;
	}
	if (source.startsWith("\n", delimiterEnd)) {
		return delimiterEnd + 1;
	}
	return delimiterEnd;
}

function parseYamlObject(source: string): Record<string, unknown> {
	if (source.trim() === "") {
		return {};
	}
	const parsed = load(source);
	if (parsed === undefined) {
		return {};
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error("Markdown frontmatter must be a YAML object.");
	}
	return parsed as Record<string, unknown>;
}

/**
 * Parses optional YAML frontmatter at the beginning of a Markdown document.
 *
 * @throws When the YAML is invalid, is not an object, or has no closing
 * delimiter.
 */
export function parseMarkdownFrontmatter<
	Data extends Record<string, unknown> = Record<string, unknown>,
>(source: string): ParsedMarkdownFrontmatter<Data> {
	const normalizedSource = stripByteOrderMark(source);
	const openingDelimiter = OPENING_DELIMITER_REGEX.exec(normalizedSource);

	if (!openingDelimiter) {
		if (/^---[\t ]*$/u.test(normalizedSource)) {
			throw new Error("Markdown frontmatter is missing a closing delimiter.");
		}
		return { content: normalizedSource, data: {} as Data };
	}

	CLOSING_DELIMITER_REGEX.lastIndex = openingDelimiter[0].length;
	const closingDelimiter = CLOSING_DELIMITER_REGEX.exec(normalizedSource);
	CLOSING_DELIMITER_REGEX.lastIndex = 0;

	if (!closingDelimiter) {
		throw new Error("Markdown frontmatter is missing a closing delimiter.");
	}

	const yamlSource = normalizedSource.slice(
		openingDelimiter[0].length,
		closingDelimiter.index,
	);
	const contentStart = getContentStart(
		normalizedSource,
		closingDelimiter.index + closingDelimiter[0].length,
	);

	return {
		content: normalizedSource.slice(contentStart),
		data: parseYamlObject(yamlSource) as Data,
	};
}
