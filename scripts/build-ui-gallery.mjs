import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const docsDir = path.join(root, "docs/api");
const storybookDir = path.join(root, ".storybook-static");
const pagesDir = path.join(root, ".pages");
const uiDir = path.join(pagesDir, "ui");
const storybookTargetDir = path.join(uiDir, "storybook");
const storybookIndexPath = path.join(storybookDir, "index.json");

const previewWidth = 430;
const previewHeight = 520;

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function storyPath(entry) {
	const importPath = entry.importPath ?? "";
	if (importPath.startsWith("./packages/ui/")) return "packages/ui";
	if (importPath.startsWith("./app/src/components/")) return "app/components";
	return "other";
}

function groupLabel(title) {
	const parts = title.split("/");
	if (parts[0] === "ui" || parts[0] === "forms" || parts[0] === "display") {
		return "packages/ui";
	}
	if (parts[0] === "components") {
		return parts.slice(0, 3).join("/");
	}
	return parts.slice(0, 2).join("/");
}

function normalizeStories(entries) {
	return Object.values(entries)
		.filter((entry) => entry.type === "story")
		.map((entry) => ({
			id: entry.id,
			name: entry.name,
			title: entry.title,
			importPath: entry.importPath ?? "",
			componentPath: entry.componentPath ?? "",
			source: storyPath(entry),
			group: groupLabel(entry.title),
		}))
		.toSorted((a, b) => {
			const byGroup = a.group.localeCompare(b.group);
			if (byGroup !== 0) return byGroup;
			const byTitle = a.title.localeCompare(b.title);
			if (byTitle !== 0) return byTitle;
			return a.name.localeCompare(b.name);
		});
}

function renderRootIndex() {
	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>s-private docs</title>
	<style>
		:root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
		body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f7f7f8; color: #171717; }
		main { width: min(720px, calc(100vw - 32px)); }
		h1 { margin: 0 0 12px; font-size: 32px; letter-spacing: 0; }
		p { margin: 0 0 24px; color: #5f6368; line-height: 1.6; }
		nav { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
		a { display: block; border: 1px solid #dedede; border-radius: 8px; padding: 18px; color: inherit; text-decoration: none; background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / 0.05); }
		a:hover { border-color: #4076a2; }
		span { display: block; margin-top: 6px; color: #6d6d6d; font-size: 14px; }
		@media (prefers-color-scheme: dark) {
			body { background: #171717; color: #fff; }
			p, span { color: #a3a3a3; }
			a { background: #202020; border-color: #343434; }
		}
	</style>
</head>
<body>
	<main>
		<h1>s-private</h1>
		<p>Generated project documentation and UI previews.</p>
		<nav>
			<a href="./ui/">UI Gallery<span>Figma-style Storybook overview</span></a>
			<a href="./api/">API Docs<span>TypeDoc and database schema documentation</span></a>
		</nav>
	</main>
</body>
</html>
`;
}

function renderGallery(stories) {
	const groups = Map.groupBy(stories, (story) => story.group);
	const groupMarkup = [...groups.entries()]
		.map(([group, groupStories]) => {
			const cards = groupStories
				.map((story) => {
					const storyUrl = `./storybook/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`;
					const fullUrl = `./storybook/?path=/story/${encodeURIComponent(story.id)}`;
					const searchable = [
						story.group,
						story.title,
						story.name,
						story.importPath,
						story.componentPath,
						story.source,
					]
						.join(" ")
						.toLowerCase();

					return `<article class="story-card" data-story-card data-search="${escapeHtml(searchable)}">
	<div class="story-frame">
		<iframe title="${escapeHtml(`${story.title}: ${story.name}`)}" src="${storyUrl}" loading="lazy"></iframe>
	</div>
	<div class="story-meta">
		<div>
			<h3>${escapeHtml(story.name)}</h3>
			<p>${escapeHtml(story.title)}</p>
		</div>
		<a href="${fullUrl}" target="_blank" rel="noreferrer">Open</a>
	</div>
</article>`;
				})
				.join("\n");

			return `<section class="story-group" data-story-group>
	<div class="group-heading">
		<div>
			<p>${escapeHtml(groupStories[0]?.source ?? "stories")}</p>
			<h2>${escapeHtml(group)}</h2>
		</div>
		<span>${groupStories.length} stories</span>
	</div>
	<div class="story-row">${cards}</div>
</section>`;
		})
		.join("\n");

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>UI Gallery</title>
	<style>
		:root {
			color-scheme: light dark;
			--bg: #f4f4f5;
			--surface: #ffffff;
			--surface-2: #fafafa;
			--text: #18181b;
			--muted: #71717a;
			--border: #dedee3;
			--accent: #4076a2;
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		}
		* { box-sizing: border-box; }
		html { scroll-behavior: smooth; }
		body { margin: 0; background: var(--bg); color: var(--text); }
		header {
			position: sticky;
			top: 0;
			z-index: 10;
			display: grid;
			gap: 16px;
			padding: 20px clamp(16px, 3vw, 32px);
			border-bottom: 1px solid var(--border);
			background: color-mix(in srgb, var(--surface) 88%, transparent);
			backdrop-filter: blur(14px);
		}
		.header-top { display: flex; align-items: end; justify-content: space-between; gap: 16px; }
		h1 { margin: 0; font-size: clamp(28px, 4vw, 44px); line-height: 1; letter-spacing: 0; }
		.summary { margin: 8px 0 0; color: var(--muted); }
		.header-actions { display: flex; align-items: center; gap: 10px; }
		.header-actions a {
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 9px 12px;
			color: inherit;
			text-decoration: none;
			background: var(--surface);
			font-size: 14px;
		}
		.search-wrap { position: relative; }
		input {
			width: 100%;
			height: 44px;
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 0 14px;
			background: var(--surface);
			color: var(--text);
			font: inherit;
		}
		main { display: grid; gap: 32px; padding: 28px clamp(16px, 3vw, 32px) 56px; }
		.story-group { display: grid; gap: 14px; }
		.group-heading {
			display: flex;
			align-items: end;
			justify-content: space-between;
			gap: 12px;
		}
		.group-heading p { margin: 0 0 4px; color: var(--muted); font-size: 13px; }
		.group-heading h2 { margin: 0; font-size: 20px; letter-spacing: 0; }
		.group-heading span { color: var(--muted); font-size: 13px; white-space: nowrap; }
		.story-row {
			display: grid;
			grid-auto-columns: ${previewWidth}px;
			grid-auto-flow: column;
			gap: 16px;
			overflow-x: auto;
			overscroll-behavior-x: contain;
			scroll-snap-type: x proximity;
			padding: 2px 4px 16px;
		}
		.story-card {
			scroll-snap-align: start;
			display: grid;
			grid-template-rows: ${previewHeight}px auto;
			min-width: 0;
			border: 1px solid var(--border);
			border-radius: 8px;
			overflow: hidden;
			background: var(--surface);
			box-shadow: 0 1px 3px rgb(0 0 0 / 0.06);
		}
		.story-frame {
			background:
				linear-gradient(45deg, color-mix(in srgb, var(--border) 35%, transparent) 25%, transparent 25%),
				linear-gradient(-45deg, color-mix(in srgb, var(--border) 35%, transparent) 25%, transparent 25%),
				linear-gradient(45deg, transparent 75%, color-mix(in srgb, var(--border) 35%, transparent) 75%),
				linear-gradient(-45deg, transparent 75%, color-mix(in srgb, var(--border) 35%, transparent) 75%);
			background-position: 0 0, 0 8px, 8px -8px, -8px 0;
			background-size: 16px 16px;
		}
		iframe { width: 100%; height: 100%; border: 0; background: white; }
		.story-meta {
			display: flex;
			align-items: start;
			justify-content: space-between;
			gap: 12px;
			padding: 12px;
			border-top: 1px solid var(--border);
			background: var(--surface-2);
		}
		.story-meta h3 {
			margin: 0;
			font-size: 14px;
			line-height: 1.25;
			letter-spacing: 0;
			overflow-wrap: anywhere;
		}
		.story-meta p {
			margin: 5px 0 0;
			color: var(--muted);
			font-size: 12px;
			line-height: 1.35;
			overflow-wrap: anywhere;
		}
		.story-meta a {
			border: 1px solid var(--border);
			border-radius: 7px;
			padding: 6px 9px;
			color: var(--accent);
			text-decoration: none;
			background: var(--surface);
			font-size: 12px;
			font-weight: 600;
		}
		.empty {
			display: none;
			padding: 40px;
			border: 1px dashed var(--border);
			border-radius: 8px;
			text-align: center;
			color: var(--muted);
			background: var(--surface);
		}
		@media (max-width: 560px) {
			.header-top { align-items: start; flex-direction: column; }
			.story-row { grid-auto-columns: min(86vw, ${previewWidth}px); }
			.story-card { grid-template-rows: min(${previewHeight}px, 108vw) auto; }
		}
		@media (prefers-color-scheme: dark) {
			:root {
				--bg: #111113;
				--surface: #18181b;
				--surface-2: #202024;
				--text: #fafafa;
				--muted: #a1a1aa;
				--border: #303037;
				--accent: #72a5d3;
			}
		}
	</style>
</head>
<body>
	<header>
		<div class="header-top">
			<div>
				<h1>UI Gallery</h1>
				<p class="summary"><span id="visible-count">${stories.length}</span> of ${stories.length} stories, rendered from Storybook.</p>
			</div>
			<div class="header-actions">
				<a href="../api/">API Docs</a>
				<a href="./storybook/">Storybook</a>
			</div>
		</div>
		<div class="search-wrap">
			<input id="search" type="search" placeholder="Filter by component, story, path, or package" autocomplete="off">
		</div>
	</header>
	<main>
		<div class="empty" id="empty">No stories match the current filter.</div>
		${groupMarkup}
	</main>
	<script>
		const searchInput = document.querySelector("#search");
		const visibleCount = document.querySelector("#visible-count");
		const empty = document.querySelector("#empty");
		const cards = Array.from(document.querySelectorAll("[data-story-card]"));
		const groups = Array.from(document.querySelectorAll("[data-story-group]"));

		function applyFilter() {
			const query = searchInput.value.trim().toLowerCase();
			let shown = 0;
			for (const card of cards) {
				const visible = query === "" || card.dataset.search.includes(query);
				card.hidden = !visible;
				if (visible) shown += 1;
			}
			for (const group of groups) {
				group.hidden = !group.querySelector("[data-story-card]:not([hidden])");
			}
			visibleCount.textContent = String(shown);
			empty.style.display = shown === 0 ? "block" : "none";
		}

		searchInput.addEventListener("input", applyFilter);
	</script>
</body>
</html>
`;
}

async function main() {
	const indexJson = JSON.parse(await readFile(storybookIndexPath, "utf8"));
	const stories = normalizeStories(indexJson.entries ?? {});

	await rm(pagesDir, { force: true, recursive: true });
	await mkdir(uiDir, { recursive: true });
	await cp(storybookDir, storybookTargetDir, { recursive: true });
	await cp(docsDir, path.join(pagesDir, "api"), { recursive: true });
	await writeFile(path.join(pagesDir, "index.html"), renderRootIndex());
	await writeFile(path.join(uiDir, "index.html"), renderGallery(stories));

	console.log(
		`Built UI gallery with ${stories.length} stories at .pages/ui/index.html`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
