# Supabase TLS verify-full + root CA pinning

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | LOW（PoC 結果次第で MEDIUM に格上げ） |
| **Status** | 未着手 / **PoC が必要** |
| **Affected File** | [packages/database/src/resolve-db-env.ts](packages/database/src/resolve-db-env.ts), [app/src/prisma.ts](app/src/prisma.ts), [packages/database/prisma.config.ts](packages/database/prisma.config.ts) |

## 概要

現状 [packages/database/src/resolve-db-env.ts:22-36](packages/database/src/resolve-db-env.ts#L22-L36) で `sslmode` を **常に `no-verify` に正規化** している（同ファイルの TODO コメントでリスクが明記済み）。MITM 耐性を取り戻すため、verify-full + Supabase root CA pinning を導入する。

## 判断材料

| 観点 | 詳細 |
|---|---|
| 現状リスク | Vercel ↔ Supabase は同一クラウド近接（AWS同士）→ MITM 現実リスクは低い |
| 実装難度 | 中〜高。pooler 経由の場合 SAN/CN が pooler ホストになるため、direct 接続用 CA だけでは pooler で失敗する |
| pooler 証明書 | Supavisor (Supabase pooler) は `*.pooler.supabase.com` の証明書を提示 |
| Direct 接続 | `db.<project-ref>.supabase.co` の証明書 |
| CA ローテーション | Supabase は 2034 年までに新 CA へ移行予定 → 期限監視が必要（security-011 で対応） |

## タスク

### 1. PoC（コード変更前に必須）

両エンドポイントの証明書チェーンを `openssl s_client` で確認:

```bash
openssl s_client -connect aws-0-<region>.pooler.supabase.com:6543 \
  -servername aws-0-<region>.pooler.supabase.com </dev/null 2>&1 | head -50

openssl s_client -connect db.<project-ref>.supabase.co:5432 \
  -servername db.<project-ref>.supabase.co </dev/null 2>&1 | head -50
```

- [ ] 両方のチェーンと SAN/CN、ルート発行者を記録
- [ ] **Amazon 系のパブリック CA で検証可能なら** `ssl: { rejectUnauthorized: true }` のみで `verify-full` 相当が成立する → CA をコミットせずに済む
- [ ] パブリック CA で不可なら Supabase Dashboard → Project Settings → Database → SSL Configuration から `prod-ca-2021.crt` 系をダウンロード

### 2. 実装

- [ ] [packages/database/src/resolve-db-env.ts](packages/database/src/resolve-db-env.ts) の `withNoVerifySsl` を `withCleanedSsl` に置換し `sslmode` を URL から削除
- [ ] [app/src/prisma.ts](app/src/prisma.ts) の `PrismaPg` 生成部に `ssl` オブジェクトを渡す:
  ```ts
  new PrismaPg({
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(path.join(__dirname, "../../packages/database/certs/supabase-ca.pem"), "utf8"),
      // または ca を省略して Node の rootCertificates に頼る（PoC で確定）
    },
  })
  ```
- [ ] [packages/database/prisma.config.ts](packages/database/prisma.config.ts) の migrate 側も同様に
- [ ] CA をコミットする場合は `packages/database/certs/supabase-ca.pem` として配置（公開 CA なので秘匿不要）

### 3. 検証

- [ ] CA を意図的に壊した状態でアプリ起動 → DB 接続失敗（fail-closed の確認）
- [ ] 正常 CA でアプリ起動 → 全クエリ疎通
- [ ] ステージング先行検証で pooler / direct 両方の接続成功を確認
- [ ] [packages/database/src/resolve-db-env.ts:13-16](packages/database/src/resolve-db-env.ts#L13-L16) の TODO コメントを削除

## もし採用しない場合

- [packages/database/src/resolve-db-env.ts:13-16](packages/database/src/resolve-db-env.ts#L13-L16) の TODO コメントを更新し「**意図的に no-verify を採用、Supabase pooler 証明書チェーン検証の運用負荷とリスクのバランスから判断**」と明記
- 次回 Supabase root CA 移行（2034 予定）時に再検討

## 後続

- security-011-supabase-ca-expiry-monitoring（採用時のみ着手）

## 関連

- 計画ファイル: `/Users/s-hirano-ist/.claude/plans/prisma-orm-supabase-velvet-cat.md` Phase C-2
- Supabase SSL: https://supabase.com/docs/guides/platform/ssl-enforcement
