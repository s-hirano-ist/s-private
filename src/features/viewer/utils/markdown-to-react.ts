import parse from "html-react-parser";
import DOMPurify from "isomorphic-dompurify"; // MEMO: Original Dompurify server side rendering causes issue on Next.js. https://www.npmjs.com/package/dompurify
import rehypeExternalLinks from "rehype-external-links";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/* Other rehype packages
 * rehype-slug
 * rehype-autolink-headings
 * remark-link-card
 * rehype-sanitize

* Packages
 * - Remark: modify markdown
 * - Rehype: modify HTML
 *
//  *  Convert
 * - mdast: mutual conversion of Markdown and AST
 * - hast:  mutual conversion of HTML and AST
 *
 * REF: https://qiita.com/sankentou/items/f8eadb5722f3b39bbbf8
 */

async function markdownToHtml(markdown: string) {
	const result = await unified()
		.use(remarkParse) // Markdown to mdast
		.use(remarkGfm)
		.use(remarkRehype) // mdast to hast
		.use(rehypeExternalLinks, { target: "_blank", rel: ["nofollow"] })
		.use(rehypeHighlight)
		.use(rehypeStringify)
		.process(markdown);

	return result.toString();
}

function htmlToReact(html: string) {
	const sanitizedHtml = DOMPurify.sanitize(html);
	return parse(sanitizedHtml);
}

export async function markdownToReact(markdown: string) {
	const html = await markdownToHtml(markdown);
	return htmlToReact(html);
}

// TODO: use MDX?
// const withMDX = createMDX({
// 	extensions: /\.mdx?$/,
// 	options: {
// 		remarkPlugins: [remarkGfm],
// 		rehypePlugins: [
// 			// rehypeHighlight,
// 			rehypeStringify,
// 			rehypePrisma,
// 			// rehypeExternalLinks({ target: "_blank", rel: ["nofollow"] }),
// 		],
// 		// If you use `MDXProvider`, uncomment the following line.
// 		// providerImportSource: "@mdx-js/react",s
// 	},
// });
