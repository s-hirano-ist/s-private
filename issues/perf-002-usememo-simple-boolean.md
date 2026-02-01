# Issue: Remove useMemo from simple boolean expression

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `rerender-simple-expression-in-memo` |
| **Priority** | LOW |
| **Impact** | Wasted computation on every render |
| **Affected File** | `app/src/components/common/layouts/nav/util-buttons.tsx` |

## Problem Description

The `shouldShowSignOut` variable uses `useMemo` for a trivial boolean comparison. According to Vercel React Best Practices, when an expression is simple and has a primitive result type, `useMemo` should not be used because calling `useMemo` and comparing hook dependencies may consume more resources than the expression itself.

### Current Code

```tsx
// line 40
const shouldShowSignOut = useMemo(() => pathname !== "/auth", [pathname]);
```

### Issues

1. `pathname !== "/auth"` is a simple string comparison that executes in microseconds
2. `useMemo` overhead (dependency comparison, callback invocation) is greater than the computation itself
3. Adds unnecessary cognitive complexity to the code

## Proposed Solution

Replace with a simple variable assignment.

### Refactored Code

```tsx
const shouldShowSignOut = pathname !== "/auth";
```

## Implementation Steps

1. [ ] Replace useMemo with direct boolean expression in util-buttons.tsx:40
2. [ ] Remove `useMemo` from imports if no longer used

## Related Patterns

- Rule: `.claude/skills/vercel-react-best-practices/rules/rerender-simple-expression-in-memo.md`
