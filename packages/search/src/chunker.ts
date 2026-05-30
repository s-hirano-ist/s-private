import type { ContentType, QdrantPayload } from "./config.ts";
import { createHash } from "node:crypto";
import { RAG_CONFIG } from "./config.ts";

// JSON article structure
type ArticleBody = {
	title: string;
	url: string;
	ogTitle?: string;
	ogDescription?: string;
	quote?: string;
};

type ArticleJson = {
	heading: string;
	description?: string;
	body: ArticleBody[];
};

// Markdown frontmatter
type MarkdownFrontmatter = {
	heading: string;
	description?: string;
	draft?: boolean;
};

/**
 * Generate content hash for change detection
 */
function generateHash(content: string): string {
	return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Generate chunk ID from doc_id and index
 */
function generateChunkId(docId: string, index: number): string {
	return `${docId}#${index}`;
}

/**
 * Parse JSON article file and generate chunks
 */
export function parseJsonArticle(
	filePath: string,
	content: string,
): QdrantPayload[] {
	const json = JSON.parse(content) as ArticleJson;
	const docId = `file:${filePath}`;
	const chunks: QdrantPayload[] = [];

	for (let i = 0; i < json.body.length; i++) {
		const item = json.body[i];

		// Build text from available fields
		const textParts: string[] = [];
		if (item.title) textParts.push(item.title);
		if (item.ogTitle && item.ogTitle !== item.title)
			textParts.push(item.ogTitle);
		if (item.ogDescription) textParts.push(item.ogDescription);
		if (item.quote) textParts.push(item.quote);

		const text = textParts.join("\n");

		// Skip empty items
		if (!text.trim()) continue;

		const chunkId = generateChunkId(docId, i);

		chunks.push({
			type: "bookmark_json",
			content_type: "articles",
			top_heading: json.heading,
			doc_id: docId,
			chunk_id: chunkId,
			title: item.title || item.ogTitle || "Untitled",
			url: item.url,
			heading_path: [json.heading],
			text,
			content_hash: generateHash(text),
		});
	}

	return chunks;
}

/**
 * Parse Markdown frontmatter
 */
function parseFrontmatter(content: string): {
	frontmatter: MarkdownFrontmatter;
	body: string;
} {
	const frontmatterMatch = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/u.exec(content);

	if (!frontmatterMatch) {
		return {
			frontmatter: { heading: "unknown" },
			body: content,
		};
	}

	const frontmatterStr = frontmatterMatch[1];
	const body = frontmatterMatch[2];

	// Simple YAML parsing for our needs
	const frontmatter: MarkdownFrontmatter = { heading: "unknown" };

	for (const line of frontmatterStr.split("\n")) {
		const [key, ...valueParts] = line.split(":");
		const value = valueParts.join(":").trim();

		if (key === "heading") {
			frontmatter.heading = value;
		} else if (key === "description") {
			frontmatter.description = value;
		} else if (key === "draft") {
			frontmatter.draft = value === "true";
		}
	}

	return { frontmatter, body };
}

type MarkdownSection = {
	headingPath: string[];
	title: string;
	content: string;
	level: number;
};

type HeadingSplitState = {
	sections: MarkdownSection[];
	currentSection: MarkdownSection | null;
	headingStack: { level: number; title: string }[];
	preambleContent: string;
	preambleDone: boolean;
};

function pushPreambleSection(state: HeadingSplitState): void {
	if (state.preambleContent.trim()) {
		state.sections.push({
			headingPath: [],
			title: "",
			content: state.preambleContent,
			level: 0,
		});
	}
}

function handleHeadingLine(
	state: HeadingSplitState,
	headingMatch: RegExpExecArray,
): void {
	// Finalize preamble on first H2/H3
	if (!state.preambleDone) {
		state.preambleDone = true;
		pushPreambleSection(state);
	}

	// Save previous section
	if (state.currentSection?.content.trim()) {
		state.sections.push(state.currentSection);
	}

	const level = headingMatch[1].length;
	const title = headingMatch[2];

	// Update heading stack
	const headingStack = state.headingStack;
	let top = headingStack.at(-1);
	while (top && top.level >= level) {
		headingStack.pop();
		top = headingStack.at(-1);
	}
	headingStack.push({ level, title });

	state.currentSection = {
		headingPath: headingStack.map((h) => h.title),
		title,
		content: "",
		level,
	};
}

/**
 * Split markdown into sections by headings
 */
function splitMarkdownByHeadings(content: string): MarkdownSection[] {
	const state: HeadingSplitState = {
		sections: [],
		currentSection: null,
		headingStack: [],
		// Preamble buffer (content before first H2/H3)
		preambleContent: "",
		preambleDone: false,
	};

	for (const line of content.split("\n")) {
		// Skip H1 lines (redundant with frontmatter description)
		if (/^#\s+\S/u.test(line)) {
			continue;
		}

		const headingMatch = /^(#{2,3})\s+(\S.*)$/u.exec(line);

		if (headingMatch) {
			handleHeadingLine(state, headingMatch);
		} else if (!state.preambleDone) {
			// Content before first H2/H3 goes to preamble
			state.preambleContent += `${line}\n`;
		} else if (state.currentSection) {
			state.currentSection.content += `${line}\n`;
		}
	}

	// If no H2/H3 found, all content is preamble
	if (!state.preambleDone) {
		pushPreambleSection(state);
	}

	// Save last section
	if (state.currentSection?.content.trim()) {
		state.sections.push(state.currentSection);
	}

	return state.sections;
}

/**
 * Split long text into smaller chunks by paragraphs
 */
function splitByParagraphs(text: string, maxLength: number): string[] {
	if (text.length <= maxLength) {
		return [text];
	}

	const paragraphs = text.split(/\n{2,}/u);
	const chunks: string[] = [];
	let currentChunk = "";

	for (const para of paragraphs) {
		if (currentChunk.length + para.length > maxLength && currentChunk) {
			chunks.push(currentChunk.trim());
			currentChunk = para;
		} else {
			currentChunk += (currentChunk ? "\n\n" : "") + para;
		}
	}

	if (currentChunk.trim()) {
		chunks.push(currentChunk.trim());
	}

	return chunks;
}

/**
 * Core markdown parsing logic with explicit doc_id
 */
function parseMarkdownWithDocId(
	docId: string,
	content: string,
	contentType: ContentType = "notes",
): QdrantPayload[] {
	const { frontmatter, body } = parseFrontmatter(content);
	const chunks: QdrantPayload[] = [];

	// Skip draft files
	if (frontmatter.draft) {
		return [];
	}

	const sections = splitMarkdownByHeadings(body);

	let chunkIndex = 0;

	for (const section of sections) {
		// Split long sections
		const textChunks = splitByParagraphs(
			section.content,
			RAG_CONFIG.chunking.maxChunkLength,
		);

		for (const text of textChunks) {
			if (!text.trim()) continue;

			const isPreamble = section.level === 0 && section.title === "";
			const sectionTitle = isPreamble
				? (frontmatter.description ?? frontmatter.heading)
				: section.title;
			const fullHeadingPath = isPreamble
				? [frontmatter.heading]
				: [frontmatter.heading, ...section.headingPath];
			const chunkId = generateChunkId(docId, chunkIndex);

			chunks.push({
				type: "markdown_note",
				content_type: contentType,
				top_heading: frontmatter.heading,
				doc_id: docId,
				chunk_id: chunkId,
				title: sectionTitle,
				heading_path: fullHeadingPath,
				text,
				content_hash: generateHash(text),
			});

			chunkIndex++;
		}
	}

	return chunks;
}

/**
 * Parse Markdown file and generate chunks
 */
export function parseMarkdown(
	filePath: string,
	content: string,
	contentType: ContentType = "notes",
): QdrantPayload[] {
	return parseMarkdownWithDocId(`file:${filePath}`, content, contentType);
}

/**
 * Parse a DB note into chunks for Qdrant ingestion
 */
export function parseDbNote(
	noteId: string,
	title: string,
	markdown: string,
): QdrantPayload[] {
	const docId = `db:note:${noteId}`;
	const syntheticContent = `---\nheading: ${title}\n---\n\n## ${title}\n\n${markdown}`;
	return parseMarkdownWithDocId(docId, syntheticContent, "notes");
}

/**
 * Parse a DB article into chunks for Qdrant ingestion
 */
export function parseDbArticle(article: {
	id: string;
	title: string;
	url: string;
	ogTitle?: string | null;
	ogDescription?: string | null;
	quote?: string | null;
	categoryName: string;
}): QdrantPayload[] {
	const docId = `db:article:${article.id}`;
	const textParts: string[] = [];
	if (article.title) textParts.push(article.title);
	if (article.ogTitle && article.ogTitle !== article.title)
		textParts.push(article.ogTitle);
	if (article.ogDescription) textParts.push(article.ogDescription);
	if (article.quote) textParts.push(article.quote);

	const text = textParts.join("\n");
	if (!text.trim()) return [];

	return [
		{
			type: "bookmark_json",
			content_type: "articles",
			top_heading: article.categoryName,
			doc_id: docId,
			chunk_id: `${docId}#0`,
			title: article.title || article.ogTitle || "Untitled",
			url: article.url,
			heading_path: [article.categoryName],
			text,
			content_hash: generateHash(text),
		},
	];
}
