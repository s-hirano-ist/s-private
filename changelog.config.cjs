module.exports = {
	disableEmoji: false,
	list: ["test", "feat", "fix", "chore", "docs", "refactor", "ci", "perf"],

	maxMessageLength: 64,
	minMessageLength: 3,
	questions: [
		"type",
		"scope",
		"subject",
		"body",
		"breaking",
		"issues",
		"lerna",
	],

	types: {
		chore: {
			description: "ビルドプロセスまたは補助ツールの変更",
			emoji: "🤖",
			value: "chore",
		},
		ci: {
			description: "CI関連の変更",
			emoji: "🎡",
			value: "ci",
		},
		docs: {
			description: "ドキュメントの変更のみ",
			emoji: "✏️",
			value: "docs",
		},
		feat: {
			description: "新機能の追加や更新",
			emoji: "🎸",
			value: "feat",
		},
		fix: {
			description: "バグ修正",
			emoji: "🐛",
			value: "fix",
		},
		perf: {
			description: "パフォーマンスを向上させるコード変更",
			emoji: "⚡️",
			value: "perf",
		},
		refactor: {
			description: "リファクタリング",
			emoji: "💡",
			value: "refactor",
		},
		test: {
			description: "テストの追加・修正",
			emoji: "💍",
			value: "test",
		},
	},
};
