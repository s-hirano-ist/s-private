import { afterEach, beforeEach, vi } from "vitest";

// Mock environment variables for testing
vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
vi.stubEnv("PUSHOVER_URL", "https://api.pushover.net/1/messages.json");
vi.stubEnv("PUSHOVER_USER_KEY", "test-user-key");
vi.stubEnv("PUSHOVER_APP_TOKEN", "test-app-token");
vi.stubEnv("USERNAME_TO_EXPORT", "test-user");

afterEach(() => {});

beforeEach(() => {
	vi.clearAllMocks();
});
