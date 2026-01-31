# js-set-map-lookups: ロケールバリデーションでの非効率なルックアップ

## 概要
- **Rule**: `js-set-map-lookups`
- **Impact**: LOW-MEDIUM
- **File**: `app/src/app/[locale]/layout.tsx`
- **Lines**: 19

## 問題

`LocaleLayout`コンポーネントで、`routing.locales.includes()`を使用してロケールの検証を行っている。

`Array.includes()`はO(n)の線形探索である。現在は2つのロケール（en/ja）のみなので影響は軽微だが、`Set`を使用すればO(1)のルックアップが可能。

### 現在のコード

```typescript
import { routing } from "@/infrastructures/i18n/routing";

export default async function LocaleLayout({ children, params }: Params) {
	const { locale } = await params;
	// Ensure that the incoming `locale` is valid
	if (!routing.locales.includes(locale as "en" | "ja")) {
		notFound();
	}
	// ...
}
```

## 解決策

`routing`モジュール内で`Set`を提供するか、レイアウトファイル内でSetを作成する。

### オプション1: routingモジュールを拡張

```typescript
// infrastructures/i18n/routing.ts
export const routing = {
	locales: ["en", "ja"] as const,
	// ...
};

export const localeSet = new Set(routing.locales);
```

### オプション2: レイアウトファイル内でSetを作成

```typescript
import { routing } from "@/infrastructures/i18n/routing";

const VALID_LOCALES = new Set(routing.locales);

export default async function LocaleLayout({ children, params }: Params) {
	const { locale } = await params;
	// Ensure that the incoming `locale` is valid
	if (!VALID_LOCALES.has(locale as "en" | "ja")) {
		notFound();
	}
	// ...
}
```

## 補足

このケースでは要素数が2つのみであり、パフォーマンスへの実際の影響は無視できるレベル。ただし、以下の理由から`Set`の使用を推奨:

1. **意図の明確化**: 「有効なロケールのセットに含まれているか」という意図がより明確に表現される
2. **将来の拡張性**: サポートロケールが増えた場合にも対応できる
3. **一貫性**: プロジェクト全体で同じパターンを使用することでコードの一貫性が保たれる

## 参考
- Vercel React Best Practices: `rules/js-set-map-lookups.md`
