# DDD-008: OgImageUrl の URL 検証不足

## 概要

`Url` 値オブジェクトは HTTP/HTTPS プロトコル検証を行っているが、`OgImageUrl` は文字列長のみの検証で、URL としての妥当性が検証されていない。

## 問題箇所

`packages/core/articles/entities/article-entity.ts:287-292`

```typescript
export const OgImageUrl = z
  .string()
  .max(1024, { message: "tooLong" })
  .nullable()
  .optional()
  .brand<"OgImageUrl">();
```

比較: `Url` 値オブジェクト（同ファイル:179-196）

```typescript
export const Url = z
  .url({ message: "invalidFormat" })
  .min(1, { message: "required" })
  .max(1024, { message: "tooLong" })
  .refine(
    (url: string) => {
      try {
        const urlObject = new URL(url);
        return urlObject.protocol === "http:" || urlObject.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "invalidFormat" },
  )
  .brand<"Url">();
```

## DDDの原則との乖離

- `Url` 値オブジェクトはプロトコル検証（HTTP/HTTPS）を行っているが、`OgImageUrl` は単なる文字列として扱われている
- 値オブジェクトとしての振る舞いの一貫性がない
- 不正な URL が OgImageUrl として保存される可能性

## 影響

- 不正な URL 形式のデータが保存される可能性
- フロントエンドで OgImageUrl を使用する際にエラーが発生する可能性
- 値オブジェクトの信頼性が低下

## 推奨対応

### 案1: URL 検証を追加（推奨）

```typescript
export const OgImageUrl = z
  .string()
  .max(1024, { message: "tooLong" })
  .refine(
    (url: string) => {
      if (!url) return true; // nullable なので空は許可
      try {
        const urlObject = new URL(url);
        return urlObject.protocol === "http:" || urlObject.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "invalidFormat" },
  )
  .nullable()
  .optional()
  .brand<"OgImageUrl">();
```

### 案2: 共通の URL 検証ユーティリティを作成

```typescript
// shared-kernel/entities/url-utils.ts
const isValidHttpUrl = (url: string): boolean => {
  try {
    const urlObject = new URL(url);
    return urlObject.protocol === "http:" || urlObject.protocol === "https:";
  } catch {
    return false;
  }
};

// 各 URL 系値オブジェクトで使用
export const Url = z.string().refine(isValidHttpUrl, ...).brand<"Url">();
export const OgImageUrl = z.string().refine(isValidHttpUrl, ...).nullable().optional().brand<"OgImageUrl">();
```

### 案3: 設計意図を明確化（最小対応）

「外部から取得した未検証の URL」という意図を明確にコメントで記載:

```typescript
/**
 * Open Graph image URL from external sources.
 *
 * @remarks
 * This value object intentionally does NOT validate URL format because:
 * - OG data is fetched from external sources and may contain non-standard URLs
 * - Validation failures would prevent saving valid articles with malformed OG data
 * - Frontend should handle invalid URLs gracefully
 */
export const OgImageUrl = z.string().max(1024)...
```

## 優先度

低

## 関連ファイル

- `packages/core/articles/entities/article-entity.ts`
- `OgTitle`, `OgDescription` も同様のパターンで定義されているが、これらは URL ではないため問題なし
