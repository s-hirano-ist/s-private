import { createServer } from "node:http";

// No application bundle, third-party scripts, credentials or external reporting.
// This page distinguishes injected browser-tool styles from application styles.
const policy = [
	"default-src 'self'",
	"script-src-elem 'self' 'unsafe-inline'",
	"style-src-elem 'self' 'report-sample'",
	"style-src-attr 'unsafe-inline'",
	"report-uri /report",
].join("; ");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>CSP origin probe</title>
<script>
document.addEventListener('securitypolicyviolation', (event) => {
  const target = document.getElementById('violations');
  const violations = JSON.parse(target.textContent);
  violations.push({ directive: event.effectiveDirective, source: event.sourceFile,
    line: event.lineNumber, column: event.columnNumber, sample: event.sample });
  target.textContent = JSON.stringify(violations, null, 2);
});
</script></head><body><h1>CSP origin probe</h1><pre id="violations">[]</pre>
<p>No application JavaScript or styles. Reports stay on this local server.</p></body></html>`;

createServer(async (request, response) => {
	if (request.url === "/report") {
		// Discard reports locally; the DOM listener shows only the diagnostic fields.
		for await (const _chunk of request) {
			/* drain the request without retaining user/browser data */
		}
		response.writeHead(204).end();
		return;
	}
	response.setHeader("content-security-policy", policy);
	response.setHeader("content-type", "text/html; charset=utf-8");
	response.end(html);
}).listen(4320, "127.0.0.1");
