# Issue: 機密データを含むレスポンスにCache-Control: no-storeが設定されていない

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | HIGH |
| **Check Item** | キャッシュ制御 |
| **Affected File** | `app/next.config.mjs` |

## Problem Description

認証が必要なプライベートアプリケーションにおいて、機密データを含むレスポンスに`Cache-Control: no-store`ヘッダが設定されていません。これにより、CDNやプロキシ、ブラウザキャッシュに機密情報が保存される可能性があります。

### Current Code/Configuration

```javascript
// app/next.config.mjs - headers()関数
// Cache-Controlヘッダが設定されていない
async headers() {
    return [
        {
            source: "/(.*)",
            headers: [
                // セキュリティヘッダのみ、キャッシュ制御なし
            ],
        },
    ];
},
```

### Issues

1. 認証済みユーザーの個人データがCDNにキャッシュされる可能性
2. 共有コンピュータでブラウザキャッシュから情報が漏洩するリスク
3. プロキシサーバーでの不適切なキャッシュ

## Recommendation

認証が必要なページに対して`Cache-Control: private, no-store`を設定します。

### Suggested Fix

```javascript
// app/next.config.mjs
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
                    key: "Cache-Control",
                    value: "private, no-store, must-revalidate",
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
        // 静的アセットは別途キャッシュ可能に設定
        {
            source: "/_next/static/(.*)",
            headers: [
                {
                    key: "Cache-Control",
                    value: "public, max-age=31536000, immutable",
                },
            ],
        },
    ];
},
```

## Implementation Steps

1. [ ] `app/next.config.mjs`のheaders()にCache-Controlを追加
2. [ ] 静的アセット用の別ルールを追加（パフォーマンス維持）
3. [ ] ビルドして動作確認
4. [ ] ブラウザのNetwork DevToolsでヘッダを確認

## References

- https://zenn.dev/catnose99/articles/547cbf57e5ad28
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
- https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/06-Testing_for_Browser_Cache_Weaknesses
