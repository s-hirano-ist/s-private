# Issue: Use immutable array sorting instead of mutating sort()

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `js-immutable-sort` |
| **Priority** | MEDIUM-HIGH |
| **Impact** | Array mutation can cause subtle React state bugs and unpredictable behavior |
| **Affected File** | `app/src/application-services/search/search-content.ts` |

## Problem Description

The `searchContent()` function uses the mutating `Array.prototype.sort()` method on the `results` array. According to Vercel React Best Practices, using `.sort()` mutates arrays in-place which can cause subtle bugs in React applications where immutability is expected.

### Current Code

```tsx
// line 170-181
results.sort((a, b) => {
    // Simple relevance scoring based on title vs content matches
    const aInTitle = a.title.toLowerCase().includes(queryLower) ? 2 : 0;
    const bInTitle = b.title.toLowerCase().includes(queryLower) ? 2 : 0;
    const aInSnippet = a.snippet.toLowerCase().includes(queryLower) ? 1 : 0;
    const bInSnippet = b.snippet.toLowerCase().includes(queryLower) ? 1 : 0;

    const aScore = aInTitle + aInSnippet;
    const bScore = bInTitle + bInSnippet;

    return bScore - aScore;
});
```

### Issues

1. `sort()` mutates the original `results` array in-place
2. While this specific case is in a server function where mutation may be acceptable, using immutable patterns ensures consistency and prevents future bugs if the code is refactored
3. `toSorted()` is now widely supported (ES2023) and provides the same functionality without mutation

## Proposed Solution

Replace `results.sort()` with `results.toSorted()` and assign the result to a new variable or use it directly in the return statement.

### Refactored Code

```tsx
// line 170-184
const sortedResults = results.toSorted((a, b) => {
    // Simple relevance scoring based on title vs content matches
    const aInTitle = a.title.toLowerCase().includes(queryLower) ? 2 : 0;
    const bInTitle = b.title.toLowerCase().includes(queryLower) ? 2 : 0;
    const aInSnippet = a.snippet.toLowerCase().includes(queryLower) ? 1 : 0;
    const bInSnippet = b.snippet.toLowerCase().includes(queryLower) ? 1 : 0;

    const aScore = aInTitle + aInSnippet;
    const bScore = bInTitle + bInSnippet;

    return bScore - aScore;
});

return {
    results: sortedResults.slice(0, limit),
    groups,
    totalCount: results.length,
    query,
};
```

## Implementation Steps

1. [ ] Replace `results.sort()` with `results.toSorted()` at line 170
2. [ ] Store the result in a new variable `sortedResults`
3. [ ] Update the return statement to use `sortedResults.slice(0, limit)`
4. [ ] Verify TypeScript configuration supports ES2023 array methods

## Related Patterns

- Rule: `.claude/skills/vercel-react-best-practices/rules/js-tosorted-immutable.md`
