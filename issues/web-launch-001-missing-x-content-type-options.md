# Issue: X-Content-Type-Optionsヘッダが設定されていない

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | HIGH |
| **Check Item** | レスポンスヘッダ |
| **Affected File** | `app/next.config.mjs` |

## Problem Description

セキュリティレスポンスヘッダの`X-Content-Type-Options: nosniff`が設定されていません。このヘッダがないと、ブラウザがMIMEタイプを推測（MIME sniffing）し、XSS攻撃のリスクが高まります。

### Current Code/Configuration

```javascript
// app/next.config.mjs - lines 63-91
async headers() {
    return [
        {
            source: "/(.*)",
            headers: [
                {
                    key: "Strict-Transport-Security",
                    value: "max-age=31536000; includeSubDomains; preload",
                },
                {
                    key: "X-Frame-Options",
                    value: "SAMEORIGIN",
                },
                {
                    key: "Referrer-Policy",
                    value: "strict-origin-when-cross-origin",
                },
                {
                    key: "Content-Security-Policy",
                    value: cspHeader.replaceAll("\n", ""),
                },
                {
                    key: "Report-To",
                    value: `{"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"${process.env.SENTRY_REPORT_URL}"}],"include_subdomains":true}`,
                },
            ],
        },
    ];
},
```

### Issues

1. `X-Content-Type-Options: nosniff`ヘッダが含まれていない
2. OWASP推奨のセキュリティヘッダが不完全

## Recommendation

`headers()`配列に`X-Content-Type-Options`を追加してMIME sniffingを防止します。

### Suggested Fix

```javascript
async headers() {
    return [
        {
            source: "/(.*)",
            headers: [
                {
                    key: "Strict-Transport-Security",
                    value: "max-age=31536000; includeSubDomains; preload",
                },
                {
                    key: "X-Frame-Options",
                    value: "SAMEORIGIN",
                },
                {
                    key: "X-Content-Type-Options",
                    value: "nosniff",
                },
                {
                    key: "Referrer-Policy",
                    value: "strict-origin-when-cross-origin",
                },
                {
                    key: "Content-Security-Policy",
                    value: cspHeader.replaceAll("\n", ""),
                },
                {
                    key: "Report-To",
                    value: `{"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"${process.env.SENTRY_REPORT_URL}"}],"include_subdomains":true}`,
                },
            ],
        },
    ];
},
```

## Implementation Steps

1. [ ] `app/next.config.mjs`を開く
2. [ ] `headers()`関数内のheaders配列に`X-Content-Type-Options`を追加
3. [ ] ビルドして動作確認
4. [ ] ブラウザのNetwork DevToolsでヘッダが適用されていることを確認

## References

- https://zenn.dev/catnose99/articles/547cbf57e5ad28
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
- https://owasp.org/www-project-secure-headers/
