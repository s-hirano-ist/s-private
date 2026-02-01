# Issue: Replace useMemo with useCallback for function memoization

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | Semantic clarity / React idioms |
| **Priority** | LOW |
| **Impact** | Code readability and maintainability |
| **Affected File** | `app/src/components/common/layouts/nav/util-buttons.tsx` |

## Problem Description

The component uses `useMemo` to memoize callback functions. While functionally equivalent to `useCallback`, this pattern is semantically confusing because `useMemo` is intended for memoizing values, not functions. Using `useCallback` provides clearer intent.

### Current Code

```tsx
// lines 22-28
const handleTheme = useMemo(
    () => () => {
        if (theme === "light") setTheme("dark");
        else setTheme("light");
    },
    [theme, setTheme],
);

// lines 30-38
const handleLanguage = useMemo(
    () => () => {
        redirect({
            href: removeLangPrefix(pathname),
            locale: locale === "en" ? "ja" : "en",
        });
    },
    [pathname, locale],
);
```

### Issues

1. `useMemo(() => () => {...})` is semantically confusing - the nested arrow function is awkward
2. `useCallback` is the idiomatic way to memoize functions in React
3. Code reviewers may be confused by the pattern

## Proposed Solution

Replace `useMemo(() => () => {...})` with `useCallback(() => {...})` for clearer intent.

### Refactored Code

```tsx
const handleTheme = useCallback(() => {
    if (theme === "light") setTheme("dark");
    else setTheme("light");
}, [theme, setTheme]);

const handleLanguage = useCallback(() => {
    redirect({
        href: removeLangPrefix(pathname),
        locale: locale === "en" ? "ja" : "en",
    });
}, [pathname, locale]);
```

## Implementation Steps

1. [ ] Replace `useMemo(() => () => {...})` with `useCallback(() => {...})` for handleTheme (lines 22-28)
2. [ ] Replace `useMemo(() => () => {...})` with `useCallback(() => {...})` for handleLanguage (lines 30-38)
3. [ ] Update imports: add `useCallback`, remove `useMemo` if no longer used

## Related Patterns

- This is a code clarity issue rather than a specific Vercel React Best Practices rule
- The current pattern works but is not idiomatic React
