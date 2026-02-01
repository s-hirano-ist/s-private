import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const LANGUAGE_REGEX = /language-(\w+)/;
const SLUG_REGEX = /[^\w]+/g;

function generateHeadingId(children: ReactNode): string {
	return children?.toString().toLowerCase().replace(SLUG_REGEX, "-") ?? "";
}

/**
 * Props for the ViewerBodyClient component.
 *
 * @see {@link ViewerBodyClient} for the component
 */
export type ViewerBodyProps = {
	/** Optional children to render before the markdown content */
	children?: ReactNode;
	/** Markdown content to render */
	markdown: string;
};

/**
 * Converts markdown to React elements with syntax highlighting.
 *
 * @remarks
 * Features:
 * - GitHub Flavored Markdown (GFM) support
 * - Syntax highlighting with VS Code Dark+ theme
 * - Auto-generated heading IDs for anchor links
 * - External link handling with nofollow/noreferrer
 *
 * @param markdown - The markdown string to convert
 * @returns React elements representing the markdown
 *
 * @example
 * ```tsx
 * const content = await markdownToReact("# Hello\n\nWorld");
 * ```
 */
export async function markdownToReact(markdown: string) {
	const components: Components = {
		code({ className, children }) {
			const match = LANGUAGE_REGEX.exec(className || "");
			const isInline = !match;

			return isInline ? (
				<code className={className}>{children}</code>
			) : (
				<SyntaxHighlighter PreTag="div" language={match[1]} style={vscDarkPlus}>
					{String(children).replace(/\n$/, "")}
				</SyntaxHighlighter>
			);
		},
		a({ href, children }) {
			const isExternal = href?.startsWith("http");
			return (
				<a
					href={href}
					rel={isExternal ? "nofollow noreferrer" : undefined}
					target={isExternal ? "_blank" : undefined}
				>
					{children}
				</a>
			);
		},
		h1: ({ children }) => {
			const id = generateHeadingId(children);
			return <h1 id={id}>{children}</h1>;
		},
		h2: ({ children }) => {
			const id = generateHeadingId(children);
			return <h2 id={id}>{children}</h2>;
		},
		h3: ({ children }) => {
			const id = generateHeadingId(children);
			return <h3 id={id}>{children}</h3>;
		},
	};

	return (
		<ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
			{markdown}
		</ReactMarkdown>
	);
}

/**
 * A markdown viewer component with prose styling.
 *
 * @remarks
 * Server component that renders markdown content with:
 * - Prose typography from Tailwind CSS
 * - Dark mode support
 * - Responsive container width
 * - Optional children rendered before content
 *
 * @param props - Markdown content and optional children
 * @returns A styled markdown viewer
 *
 * @example
 * ```tsx
 * <ViewerBodyClient markdown={noteContent}>
 *   <h1>Note Title</h1>
 * </ViewerBodyClient>
 * ```
 *
 * @see {@link markdownToReact} for the markdown conversion function
 */
export async function ViewerBodyClient({
	children,
	markdown,
}: ViewerBodyProps) {
	const content = await markdownToReact(markdown);

	return (
		<div className="prose prose-sm dark:prose-invert mx-auto max-w-5xl space-y-8 px-4 py-2">
			{children}
			{content}
		</div>
	);
}
