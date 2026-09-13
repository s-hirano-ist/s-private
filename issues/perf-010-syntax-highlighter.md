# 構文ハイライトの言語限定とShikiを比較する

## Metadata

| Field | Value |
| --- | --- |
| Category | Performance / Rendering |
| Priority | LOW |
| Status | 比較検証待ち・移行未確定 |

## 現状

MarkdownViewerはasync Server Componentで、react-syntax-highlighterのPrismとtheme集合をimportする。
parserはmarkdown-to-jsx 9.10.2への移行・依存宣言修正が完了済みなので再移行しない。
react-syntax-highlighter 16.1.1は非推奨指定もarchiveも確認されていない。
交換理由は保守終了ではなく、実測での改善可能性。

## 比較内容

- 現行、PrismLight + 必要言語/テーマ単独import、Shiki core + 必要言語/テーマの3案。
- [Shiki公式性能指針](https://shiki.style/guide/best-performance)に従いinstanceを再利用。
  JavaScript engineを第一比較対象とし、未知言語は安全なプレーンコード表示にする。
- 保存済みコードフェンスとaliasから必要言語を調べる。
  既存の`language-(\w+)`ではC++などを正しく拾えない可能性を回帰ケースに含める。
- cold/warm時間、メモリ、server artifact、クライアントchunkを同一条件で測定する。
  現在もServer Componentなのでクライアント削減を予断しない。
- 速度・容量改善と表示互換性が確認できる場合だけ採用し、それ以外は現状維持を結論とする。
  双方MIT。追加SaaSなし。

## 完了条件・検証

- [ ] UIに着手する前にStorybook MCPの指示を取得。
- [ ] 既存GFM・見出し・raw HTML・外部リンクに加え、危険URL、未知言語、言語なし、alias、長文を確認。
- [ ] コード中のHTMLが実行されず、テーマ・改行・アクセシビリティが適切であることを検証。
- [ ] 変更した場合は`pnpm check:agent`、`pnpm build`、該当Storybookを検証。
- [ ] 計測条件と結果、採否をPR本文へ記録し、完了後に本issueを削除。
