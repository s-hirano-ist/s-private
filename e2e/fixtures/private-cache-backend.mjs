import { createServer } from "node:http";

// Isolated production-rendering fixture: no database or external services.
let records = {};
let calls = {};
let uploads = new Map();
let releaseReads;
let readGate;
function reset() {
	releaseReads?.();
	readGate = undefined;
	records = {};
	calls = {};
	uploads = new Map();
}
reset();
const timestamp = "2026-11-11T00:00:00Z";
function record(domain, user, index = 0, extra = {}) {
	const common = {
		id: `${domain}-${user}-${index}`,
		title: `${domain} ${user} ${index}`,
		status: "UNEXPORTED",
		createdAt: timestamp,
		updatedAt: timestamp,
		exportedAt: null,
	};
	return {
		...common,
		...{
			articles: {
				url: `https://example.com/${index}`,
				categoryId: "category",
				categoryName: "Tech",
				quote: null,
				ogTitle: null,
				ogDescription: null,
			},
			notes: { markdown: `Markdown ${user} ${index}` },
			books: {
				isbn: `9780306406${String(157 + index).padStart(3, "0")}`,
				rating: 4,
				tags: [],
				markdown: null,
				imagePath: null,
				googleAuthors: [],
				googleImgSrc: null,
			},
			images: {
				path: `${user}-${index}.png`,
				width: 1,
				height: 1,
				contentType: "image/png",
				fileSize: 68,
			},
		}[domain],
		...extra,
	};
}
function rows(domain, user) {
	const key = `${domain}:${user}`;
	return (records[key] ??= [record(domain, user)]);
}
async function jsonBody(request) {
	const chunks = [];
	for await (const chunk of request) chunks.push(chunk);
	return JSON.parse(Buffer.concat(chunks).toString());
}
createServer(async (request, response) => {
	try {
		const url = new URL(request.url, "http://localhost:4328");
		const path = url.pathname;
		const user =
			/better-auth.session_token=([^;]+)/u.exec(
				request.headers.cookie ?? "",
			)?.[1] ?? "anonymous";
		const send = (data, status = 200) => {
			response.writeHead(status, { "content-type": "application/json" });
			response.end(JSON.stringify(data));
		};
		if (path === "/health") return send({});
		if (path === "/__reset") {
			reset();
			return send({});
		}
		if (path === "/__calls") return send(calls);
		if (path === "/__hold") {
			readGate = new Promise((resolve) => {
				releaseReads = resolve;
			});
			return send({});
		}
		if (path === "/__release") {
			releaseReads?.();
			readGate = undefined;
			return send({});
		}
		if (path === "/__seed") {
			const {
				domain,
				user: owner = "alice",
				count = 1,
				status = "UNEXPORTED",
			} = await jsonBody(request);
			records[`${domain}:${owner}`] = Array.from(
				{ length: count },
				(_, index) => record(domain, owner, index, { status }),
			);
			return send({});
		}
		calls[`${user}:${request.method}:${path}${url.search}`] =
			(calls[`${user}:${request.method}:${path}${url.search}`] ?? 0) + 1;
		if (path === "/api/sign-in") {
			response.writeHead(302, { location: "/ja/error" });
			return response.end();
		}
		if (user === "anonymous" || user === "expired")
			return send({ error: { code: "UNAUTHORIZED" } }, 401);
		if (path === "/api/v1/session")
			return send({
				user: {
					id: user,
					name: user,
					email: `${user}@example.test`,
					image: null,
				},
				expiresAt: "2099-01-01T00:00:00Z",
			});
		if (path === "/api/v1/categories")
			return send({ data: [{ id: "category", name: "Tech" }] });
		if (path === "/api/v1/uploads") {
			const input = await jsonBody(request);
			uploads.set(input.operationId, { ...input, user });
			return send({
				uploadId: input.operationId,
				operationId: input.operationId,
				chunkSize: 1048576,
				receivedParts: [],
				expiresAt: "2099-01-01T00:00:00Z",
			});
		}
		const upload =
			/^\/api\/v1\/uploads\/([^/]+)\/(complete|chunks\/\d+)$/u.exec(path);
		if (upload) {
			const input = uploads.get(upload[1]);
			if (upload[2] === "complete") {
				const item = record(
					input.domain,
					user,
					rows(input.domain, user).length,
					input.metadata,
				);
				rows(input.domain, user).unshift(item);
				return send(
					{
						accepted: true,
						operationId: input.operationId,
						resource: { id: item.id, type: input.domain },
					},
					201,
				);
			}
			for await (const chunk of request) {
				void chunk;
			}
			return send({ accepted: true, part: Number(upload[2].split("/")[1]) });
		}
		const match = /^\/api\/v1\/(articles|notes|images|books)(?:\/(.*))?$/u.exec(
			path,
		);
		if (match) {
			const [, domain, suffix] = match;
			const data = rows(domain, user);
			if (request.method === "DELETE") {
				records[`${domain}:${user}`] = data.filter(
					(item) => item.id !== decodeURIComponent(suffix),
				);
				response.writeHead(204);
				return response.end();
			}
			if (request.method === "POST") {
				const input = await jsonBody(request);
				const item = record(domain, user, data.length, input);
				data.unshift(item);
				return send(
					{
						accepted: true,
						operationId: input.operationId,
						resource: { id: item.id, type: domain },
					},
					201,
				);
			}
			const filtered = data.filter(
				(item) =>
					item.status === (url.searchParams.get("status") ?? "UNEXPORTED"),
			);
			if (suffix === "count") return send({ count: filtered.length });
			if (suffix?.startsWith("title/") || suffix?.startsWith("isbn/")) {
				const value = decodeURIComponent(suffix.slice(suffix.indexOf("/") + 1));
				const item = data.find(
					(item) => item.title === value || item.isbn === value,
				);
				return item ? send(item) : send({ error: { code: "NOT_FOUND" } }, 404);
			}
			if (!suffix) {
				await readGate;
				const offset = Number(url.searchParams.get("offset") ?? 0);
				const limit = Number(url.searchParams.get("limit") ?? 24);
				return send({
					data: filtered.slice(offset, offset + limit),
					totalCount: filtered.length,
					offset,
					limit,
				});
			}
		}
		return send({ error: { code: "NOT_FOUND" } }, 404);
	} catch (error) {
		console.error(error);
		response.writeHead(500);
		response.end();
	}
}).listen(4328, "127.0.0.1");
