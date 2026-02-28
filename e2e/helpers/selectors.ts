export const ROUTES = {
	articles: "/ja/main/articles",
	notes: "/ja/main/notes",
	images: "/ja/main/images",
	books: "/ja/main/books",
} as const;

export const SELECTORS = {
	statusCodeView: '[data-testid="status-code-view"]',
	tryAgainButton: 'button:has-text("Try again")',
	searchButton: '[data-testid="search-button"]',
	toast: "[data-sonner-toast]",
	navArticles: 'nav a[href*="/articles"]',
	navNotes: 'nav a[href*="/notes"]',
	navImages: 'nav a[href*="/images"]',
	navBooks: 'nav a[href*="/books"]',
} as const;
