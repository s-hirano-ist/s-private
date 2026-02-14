# Issue: Embedding モデル大型化による検索品質向上

## Metadata

| Field | Value |
|-------|-------|
| **Category** | RAG / Search Quality |
| **Priority** | MEDIUM |
| **Check Item** | Embedding モデルのアップグレード |
| **Affected File** | `packages/search/src/config.ts`, `packages/search/src/embedding.ts`, `services/embedding-api/src/index.ts`, `docs/vps-deployment.md` |

## Problem Description

現在 `intfloat/multilingual-e5-small`（118M params, ~200MB メモリ, 384次元）を使用している。VPS は 4vCPU / 4GB RAM であり、メモリに十分な余裕がある。より大きなモデルに変更することで、embedding の品質（特に日本語の意味理解・類似度精度）を向上できる可能性がある。

### 現状

- **モデル**: `intfloat/multilingual-e5-small`
- **パラメータ数**: 118M
- **メモリ使用量**: ~200MB
- **ベクトル次元数**: 384
- **VPS スペック**: 4vCPU / 4GB RAM
- **メモリ余裕**: ~3.5GB 以上（Docker + cloudflared のオーバーヘッドを考慮しても十分）

### モデル比較

| モデル | パラメータ数 | メモリ使用量 (fp32) | 次元数 | MTEB Avg | VPS 適合性 |
|--------|------------|-------------------|--------|----------|-----------|
| `intfloat/multilingual-e5-small` | 118M | ~200MB | 384 | ★ | 現行 |
| `intfloat/multilingual-e5-base` | 278M | ~500MB | 768 | ★★ | 適合 |
| `intfloat/multilingual-e5-large` | 560M | ~1.1GB | 1024 | ★★★ | 適合（余裕あり） |

- **e5-base**: メモリ増加は約 +300MB。4GB VPS では問題なし。次元数が 2倍になり表現力向上
- **e5-large**: メモリ増加は約 +900MB。4GB VPS でも十分動作可能。MTEB ベンチマークで最も高品質

### 推奨

**`intfloat/multilingual-e5-large`** を推奨。メモリ ~1.1GB は 4GB VPS で十分収まる。品質向上幅が最も大きく、推論速度の低下は API キャッシュやバッチ処理で緩和可能。

ただし、推論速度が許容範囲を超える場合は `e5-base` にフォールバック可能。

## 変更が必要なファイル

### 1. `packages/search/src/config.ts`

`RAG_CONFIG` の変更:

- `qdrant.vectorSize`: `384` → `1024`（e5-large の場合）
- `qdrant.collectionName`: `"knowledge_v1"` → `"knowledge_v2"`（次元数変更のため新コレクション必須）
- `embedding.model`: `"intfloat/multilingual-e5-small"` → `"intfloat/multilingual-e5-large"`

### 2. `packages/search/src/embedding.ts`

- `dtype` オプションの検討: `"fp32"` のままでも動作するが、メモリ節約のため `"fp16"` や `"q8"` を検討
- モデルロード時間が増加するため、起動ログにモデルサイズ情報を追加（任意）

### 3. `services/embedding-api/src/index.ts`

- OpenAPI description の更新: `"multilingual-e5-small, 384次元"` → 新モデル名・次元数

### 4. `packages/search/src/qdrant-client.ts`

- コード変更は不要（`RAG_CONFIG.qdrant.vectorSize` を参照しているため自動追従）
- ただし、既存コレクションとの互換性がないため、旧コレクション削除 or 新コレクション作成が必要

### 5. `docs/vps-deployment.md`

- トラブルシューティングのメモリ記載更新: `"約 200MB"` → 新モデルのメモリ使用量
- モデルダウンロードサイズの更新: `"~100MB"` → 新モデルのサイズ

### 6. `services/embedding-api/Dockerfile`

- 変更不要だが、初回起動時のモデルダウンロードサイズが増えるためキャッシュボリュームの重要性が増す

## Implementation Steps

1. [ ] `config.ts` のモデル名・次元数・コレクション名を更新
2. [ ] `embedding.ts` の dtype を検討（fp32 vs fp16 — メモリと精度のトレードオフ）
3. [ ] `services/embedding-api/src/index.ts` の OpenAPI description を更新
4. [ ] `docs/vps-deployment.md` のメモリ・モデルサイズ記載を更新
5. [ ] VPS でモデルダウンロード・メモリ使用量を実測（`docker stats` で確認）
6. [ ] Qdrant に新コレクション `knowledge_v2` を作成
7. [ ] `rag-ingest` で全データを再 embedding・再投入
8. [ ] 代表的なクエリで検索品質を比較（旧 384次元 vs 新 1024次元）
9. [ ] 問題なければ旧コレクション `knowledge_v1` を削除
10. [ ] Docker イメージを再ビルド・VPS にデプロイ

## Risks

- **推論速度低下**: e5-large は e5-small の約 3-5倍の推論時間。バッチ処理で緩和可能だが、リアルタイム検索のレイテンシ増加を要確認
- **Qdrant ストレージ増加**: 次元数 384 → 1024 で約 2.7倍。現在のデータ量なら問題ないが認識しておく
- **再 embedding 必須**: 次元数変更のため全データの再投入が必要。rag-001（チャンク品質改善）と同時実施が効率的

## References

- `packages/search/src/config.ts` — RAG設定（モデル名・次元数）
- `packages/search/src/embedding.ts` — embedding パイプライン
- `packages/search/src/qdrant-client.ts` — Qdrant コレクション管理
- `services/embedding-api/src/index.ts` — Embedding API サーバー
- `docs/vps-deployment.md` — VPS デプロイ手順書
- [intfloat/multilingual-e5-large (HuggingFace)](https://huggingface.co/intfloat/multilingual-e5-large)
