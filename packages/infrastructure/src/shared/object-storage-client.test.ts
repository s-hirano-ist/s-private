import {
	createObjectStorageClient,
	isObjectNotFound,
	loadStorageConfig,
} from "@s-hirano-ist/s-storage";
import { once } from "node:events";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { describe, expect, test } from "vite-plus/test";

const env = {
	S3_ENDPOINT: "https://s3.us-west-004.backblazeb2.com",
	S3_REGION: "us-west-004",
	S3_ACCESS_KEY_ID: "key",
	S3_SECRET_ACCESS_KEY: "secret",
};

function createMockS3Server(requests: string[], authorizations: string[]) {
	return createServer((request, response) => {
		requests.push(`${request.method} ${request.url}`);
		authorizations.push(request.headers.authorization ?? "");
		if (request.url?.includes("missing")) {
			response.writeHead(404);
			response.end();
			return;
		}
		if (request.url?.includes("denied")) {
			response.writeHead(403);
			response.end();
			return;
		}
		if (request.url?.includes("list-type=2")) {
			response.setHeader("content-type", "application/xml");
			const second = request.url.includes("continuation-token=");
			response.end(
				`<ListBucketResult><IsTruncated>${!second}</IsTruncated>${second ? "" : "<NextContinuationToken>next</NextContinuationToken>"}<Contents><Key>images/${second ? "b" : "a"}</Key></Contents></ListBucketResult>`,
			);
			return;
		}
		request.resume();
		if (request.method === "GET") response.end("image bytes");
		else {
			response.setHeader("etag", '"test"');
			response.end();
		}
	});
}

describe("S3 object storage", () => {
	test("validates explicit S3 settings without MinIO or Cloudflare fallbacks", () => {
		expect(loadStorageConfig(env)).toMatchObject({
			region: "us-west-004",
			forcePathStyle: false,
		});
		expect(() =>
			loadStorageConfig({ ...env, S3_SECRET_ACCESS_KEY: "" }),
		).toThrow("S3_SECRET_ACCESS_KEY");
		expect(() =>
			loadStorageConfig({ ...env, S3_FORCE_PATH_STYLE: "yes" }),
		).toThrow("S3_FORCE_PATH_STYLE");
		for (const endpoint of [
			"ftp://storage.example.com",
			"https://user:secret@storage.example.com",
			"https://storage.example.com/bucket",
		]) {
			expect(() =>
				loadStorageConfig({ ...env, S3_ENDPOINT: endpoint }),
			).toThrow("S3_ENDPOINT");
		}
	});
	test("only classifies missing keys as absent", () => {
		expect(
			isObjectNotFound({
				name: "NotFound",
				$metadata: { httpStatusCode: 404 },
			}),
		).toBe(true);
		expect(
			isObjectNotFound({
				name: "NoSuchKey",
				$metadata: { httpStatusCode: 404 },
			}),
		).toBe(true);
		for (const error of [
			new Error("network"),
			{ name: "AccessDenied", $metadata: { httpStatusCode: 403 } },
			{ name: "NoSuchBucket", $metadata: { httpStatusCode: 404 } },
		])
			expect(isObjectNotFound(error)).toBe(false);
	});
	test("sends signed S3 requests, streams bodies, paginates lists and preserves errors", async () => {
		const requests: string[] = [];
		const authorizations: string[] = [];
		const server = createMockS3Server(requests, authorizations);
		server.listen(0, "127.0.0.1");
		await once(server, "listening");
		const address = server.address();
		const client = createObjectStorageClient({
			endpoint: `http://127.0.0.1:${address.port}`,
			region: "us-east-1",
			accessKeyId: "key",
			secretAccessKey: "secret",
			forcePathStyle: true,
		});
		try {
			await client.putObject("bucket", "images/a", Buffer.from("image bytes"));
			const stream = await client.getObject("bucket", "images/a");
			const bytes: Buffer[] = [];
			for await (const chunk of stream) bytes.push(Buffer.from(chunk));
			expect(Buffer.concat(bytes).toString()).toBe("image bytes");
			await client.statObject("bucket", "images/a");
			await client.removeObject("bucket", "images/a");
			expect(await client.listObjects("bucket", "images/")).toEqual([
				"images/a",
				"images/b",
			]);
			await expect(client.statObject("bucket", "missing")).rejects.toSatisfy(
				isObjectNotFound,
			);
			await expect(client.statObject("bucket", "denied")).rejects.toMatchObject(
				{ $metadata: { httpStatusCode: 403 } },
			);
			expect(
				authorizations.every((value) =>
					value.includes("/us-east-1/s3/aws4_request"),
				),
			).toBe(true);
			expect(
				requests.some((request) =>
					request.startsWith("DELETE /bucket/images/a"),
				),
			).toBe(true);
		} finally {
			client.destroy();
			await promisify(server.close.bind(server))();
		}
	});
});
