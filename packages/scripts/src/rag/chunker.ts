import { createHash } from "crypto";
import { type QdrantPayload, RAG_CONFIG } from "./config.js";

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
		if (item.url) textParts.push(item.url);

		const text = textParts.join("\n");

		// Skip empty items
		if (!text.trim()) continue;

		const chunkId = generateChunkId(docId, i);

		chunks.push({
			type: "bookmark_json",
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
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

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

/**
 * Split markdown into sections by headings
 */
function splitMarkdownByHeadings(content: string): MarkdownSection[] {
	const lines = content.split("\n");
	const sections: MarkdownSection[] = [];

	let currentHeadingPath: string[] = [];
	let currentSection: MarkdownSection | null = null;
	const headingStack: { level: number; title: string }[] = [];

	for (const line of lines) {
		const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);

		if (headingMatch) {
			// Save previous section
			if (currentSection && currentSection.content.trim()) {
				sections.push(currentSection);
			}

			const level = headingMatch[1].length;
			const title = headingMatch[2];

			// Update heading stack
			while (
				headingStack.length > 0 &&
				headingStack[headingStack.length - 1].level >= level
			) {
				headingStack.pop();
			}
			headingStack.push({ level, title });

			// Update heading path
			currentHeadingPath = headingStack.map((h) => h.title);

			currentSection = {
				headingPath: [...currentHeadingPath],
				title,
				content: "",
				level,
			};
		} else if (currentSection) {
			currentSection.content += line + "\n";
		}
	}

	// Save last section
	if (currentSection && currentSection.content.trim()) {
		sections.push(currentSection);
	}

	return sections;
}

/**
 * Split long text into smaller chunks by paragraphs
 */
function splitByParagraphs(text: string, maxLength: number): string[] {
	if (text.length <= maxLength) {
		return [text];
	}

	const paragraphs = text.split(/\n\n+/);
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
 * Parse Markdown file and generate chunks
 */
export function parseMarkdown(
	filePath: string,
	content: string,
): QdrantPayload[] {
	const { frontmatter, body } = parseFrontmatter(content);
	const docId = `file:${filePath}`;
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

			const fullHeadingPath = [frontmatter.heading, ...section.headingPath];
			const chunkId = generateChunkId(docId, chunkIndex);

			chunks.push({
				type: "markdown_note",
				top_heading: frontmatter.heading,
				doc_id: docId,
				chunk_id: chunkId,
				title: section.title,
				heading_path: fullHeadingPath,
				text,
				content_hash: generateHash(text),
			});

			chunkIndex++;
		}
	}

	return chunks;
}
