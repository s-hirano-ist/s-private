import {
	clearSessionDrafts,
	createSessionDraft,
	noteDraftFields,
} from "@/common/forms/session-draft";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

const create = (owner = "alice", domain = "notes") =>
	createSessionDraft(owner, domain, "create", noteDraftFields);
const data = (title = "日本語", markdown = "# 本文") => {
	const result = new FormData();
	result.set("title", title);
	result.set("markdown", markdown);
	result.set("operationId", "secret-operation");
	result.set("token", "secret-token");
	result.set("file", new File(["attachment"], "file.txt"));
	return result;
};
beforeEach(() => {
	vi.useFakeTimers();
	sessionStorage.clear();
});
afterEach(() => {
	clearSessionDrafts();
	vi.restoreAllMocks();
	vi.useRealTimers();
});

test("debounces allowlisted text, preserving Japanese and empty edits", () => {
	const store = create();
	store.schedule(data());
	expect(sessionStorage.getItem(store.key)).toBeNull();
	vi.advanceTimersByTime(250);
	expect(Object.fromEntries(store.read()!)).toEqual({
		title: "日本語",
		markdown: "# 本文",
	});
	expect(sessionStorage.getItem(store.key)).not.toContain("secret");
	store.schedule(data("", ""));
	store.flush();
	expect(Object.fromEntries(store.read()!)).toEqual({
		title: "",
		markdown: "",
	});
	store.dispose();
});
test("flushes before unmount and restores through a fresh controller", () => {
	const store = create();
	store.schedule(data());
	store.dispose();
	const next = create();
	expect(next.read()?.get("title")).toBe("日本語");
	next.dispose();
});
test("success/discard cancels pending saves, including later cleanup", () => {
	const store = create();
	store.schedule(data());
	store.clear();
	store.flush();
	store.dispose();
	vi.runAllTimers();
	expect(sessionStorage.getItem(store.key)).toBeNull();
});
test("separates forms and clears/revokes previous users on tenant switch", () => {
	const alice = create();
	alice.schedule(data());
	alice.flush();
	alice.schedule(data("late"));
	const otherForm = create("alice", "articles");
	expect(otherForm.read()).toBeUndefined();
	const bob = create("bob");
	bob.schedule(data("Bob"));
	bob.flush();
	alice.flush();
	alice.dispose();
	expect(sessionStorage.getItem(alice.key)).toBeNull();
	expect(bob.read()?.get("title")).toBe("Bob");
	otherForm.dispose();
	bob.dispose();
});
test("logout revokes writers so timers, edits and unmount cannot resurrect drafts", () => {
	const store = create();
	store.schedule(data());
	store.flush();
	store.schedule(data("late"));
	clearSessionDrafts();
	store.schedule(data("after logout"));
	store.flush();
	store.dispose();
	vi.runAllTimers();
	expect(sessionStorage.getItem(store.key)).toBeNull();
});
test.each([
	"{",
	"null",
	"[]",
	'{"version":2}',
	JSON.stringify({
		version: 1,
		updatedAt: 1,
		values: { title: "ok", markdown: "ok", token: "secret" },
	}),
	JSON.stringify({
		version: 1,
		updatedAt: 1,
		values: { title: 1, markdown: "" },
	}),
])("ignores and removes invalid data: %s", (raw) => {
	const store = create();
	sessionStorage.setItem(store.key, raw);
	expect(store.read()).toBeUndefined();
	expect(sessionStorage.getItem(store.key)).toBeNull();
	store.dispose();
});
test("Storage access, write/quota and delete failures never interrupt the form", () => {
	const store = create();
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("SecurityError");
	});
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("QuotaExceededError");
	});
	vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
		throw new Error("SecurityError");
	});
	expect(() => {
		store.read();
		store.schedule(data());
		store.flush();
		store.clear();
		store.dispose();
		clearSessionDrafts();
	}).not.toThrow();
});
