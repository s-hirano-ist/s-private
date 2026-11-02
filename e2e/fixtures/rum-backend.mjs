import { createServer } from "node:http";

// Hermetic production-rendering fixture. Never connects to production services.
createServer((request, response) => {
	const { pathname } = new URL(request.url, "http://localhost:4318");
	response.setHeader("content-type", "application/json");
	if (pathname === "/health") {
		response.end("{}");
	} else if (pathname === "/api/v1/session") {
		response.end(
			JSON.stringify({
				user: {
					id: "019e77af-7478-746e-9cbb-a2f51986c127",
					name: "RUM fixture",
					email: "rum@example.test",
					image: null,
				},
				expiresAt: "2099-01-01T00:00:00.000Z",
			}),
		);
	} else if (
		/^\/api\/v1\/(articles|notes|books|images)\/count$/u.test(pathname)
	) {
		response.end('{"count":0}');
	} else if (/^\/api\/v1\/(articles|notes|books|images)$/u.test(pathname)) {
		response.end('{"data":[],"totalCount":0,"offset":0,"limit":20}');
	} else if (pathname === "/api/v1/categories") {
		response.end('{"data":[]}');
	} else {
		response.statusCode = 404;
		response.end('{"error":{"code":"NOT_FOUND"}}');
	}
}).listen(4318, "127.0.0.1");
