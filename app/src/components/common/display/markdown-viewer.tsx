import type { ComponentProps, ReactNode } from "react";
import { compiler, type MarkdownToJSX } from "markdown-to-jsx/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const LANGUAGE_REGEX = /(?:^|\s)language-(\S+)/u;
const SLUG_REGEX = /\W+/gu;

function generateHeadingId(children: ReactNode): string {
	// Heading children are text at runtime; toString coercion must be preserved exactly.
	// oxlint-disable-next-line typescript/no-base-to-string -- ReactNode is a runtime-text boundary; preserving existing coercion
	return children?.toString().toLowerCase().replace(SLUG_REGEX, "-") ?? "";
}

/**
 * Props for the MarkdownViewer component.
 *
 * @see {@link MarkdownViewer} for the component
 */
export type MarkdownViewerProps = {
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
	const overrides: MarkdownToJSX.Overrides = {
		code({ className, children }: ComponentProps<"code">) {
			const match = LANGUAGE_REGEX.exec(className || "");
			const isInline = !match;

			return isInline ? (
				<code className={className}>{children}</code>
			) : (
				<SyntaxHighlighter PreTag="div" language={match[1]} style={vscDarkPlus}>
					{/* Markdown code children are raw code text at runtime; String coercion must be preserved exactly. */}
					{/* oxlint-disable-next-line typescript/no-base-to-string -- ReactNode is a runtime-text boundary; preserving existing coercion */}
					{String(children).replace(/\n$/u, "")}
				</SyntaxHighlighter>
			);
		},
		img({ src, alt, ...props }: ComponentProps<"img">) {
			if (!alt) {
				return (
					// Markdown images have dynamic external URLs; explicit presentation role for screenreaders
					// oxlint-disable-next-line nextjs/no-img-element, jsx-a11y/no-redundant-roles
					<img alt="" role="presentation" src={src} {...props} />
				);
			}
			// Markdown images have dynamic external URLs
			// oxlint-disable-next-line nextjs/no-img-element
			return <img alt={alt} src={src} {...props} />;
		},
		a({ href, children }: ComponentProps<"a">) {
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
		h1: ({ children }: ComponentProps<"h1">) => {
			const id = generateHeadingId(children);
			return <h1 id={id}>{children}</h1>;
		},
		h2: ({ children }: ComponentProps<"h2">) => {
			const id = generateHeadingId(children);
			return <h2 id={id}>{children}</h2>;
		},
		h3: ({ children }: ComponentProps<"h3">) => {
			const id = generateHeadingId(children);
			return <h3 id={id}>{children}</h3>;
		},
	};

	return compiler(markdown, { disableParsingRawHTML: true, overrides });
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
 * <MarkdownViewer markdown={noteContent}>
 *   <h1>Note Title</h1>
 * </MarkdownViewer>
 * ```
 *
 * @see {@link markdownToReact} for the markdown conversion function
 */
export async function MarkdownViewer({
	children,
	markdown,
}: MarkdownViewerProps) {
	const content = await markdownToReact(markdown);

	return (
		<div className="mx-auto prose prose-sm max-w-5xl space-y-8 px-4 py-2 dark:prose-invert">
			{children}
			{content}
		</div>
	);
}
