import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

export async function markdownToReact(markdown: string) {
	const components: Components = {
		code({ className, children }) {
			const match = /language-(\w+)/.exec(className || "");
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
			const id = children
				?.toString()
				.toLowerCase()
				.replace(/[^\w]+/g, "-");
			return <h1 id={id}>{children}</h1>;
		},
		h2: ({ children }) => {
			const id = children
				?.toString()
				.toLowerCase()
				.replace(/[^\w]+/g, "-");
			return <h2 id={id}>{children}</h2>;
		},
		h3: ({ children }) => {
			const id = children
				?.toString()
				.toLowerCase()
				.replace(/[^\w]+/g, "-");
			return <h3 id={id}>{children}</h3>;
		},
	};

	return (
		<ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
			{markdown}
		</ReactMarkdown>
	);
}
