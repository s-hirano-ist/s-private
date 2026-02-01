# Issue: Hoist RegExp patterns to module scope

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `js-hoist-regexp` |
| **Priority** | LOW-MEDIUM |
| **Impact** | Unnecessary RegExp object creation on every function call |
| **Affected File** | `packages/ui/layouts/body/viewer-body.tsx` |

## Problem Description

The `markdownToReact()` function creates RegExp patterns inside the function body. These patterns are recreated on every function call. According to Vercel React Best Practices, RegExp patterns should be hoisted to module scope to avoid unnecessary object creation.

### Current Code

```tsx
// line 41
const match = /language-(\w+)/.exec(className || "");

// lines 68, 75, 82 (repeated in h1, h2, h3 components)
.replace(/[^\w]+/g, "-")
```

### Issues

1. `markdownToReact()` is an async server function that gets called for every markdown render
2. The RegExp `/language-(\w+)/` is created every time for code block language detection
3. The RegExp `/[^\w]+/g` is created 3 times per call (once for each heading level)
4. While the impact per call is minimal, these patterns are constant and should be hoisted

## Proposed Solution

Hoist all RegExp patterns to module scope as constants.

### Refactored Code

```tsx
// Add at module scope (after imports, around line 7)
const LANGUAGE_REGEX = /language-(\w+)/;
const SLUG_REGEX = /[^\w]+/g;

// Helper function for generating heading IDs
function generateHeadingId(children: React.ReactNode): string {
    return children?.toString().toLowerCase().replace(SLUG_REGEX, "-") ?? "";
}

export async function markdownToReact(markdown: string) {
    const components: Components = {
        code({ className, children }) {
            const match = LANGUAGE_REGEX.exec(className || "");
            const isInline = !match;
            // ... rest of code component
        },
        // ... a component unchanged
        h1: ({ children }) => {
            const id = generateHeadingId(children);
            return <h1 id={id}>{children}</h1>;
        },
        h2: ({ children }) => {
            const id = generateHeadingId(children);
            return <h2 id={id}>{children}</h2>;
        },
        h3: ({ children }) => {
            const id = generateHeadingId(children);
            return <h3 id={id}>{children}</h3>;
        },
    };
    // ...
}
```

## Implementation Steps

1. [ ] Add `LANGUAGE_REGEX` constant at module scope (line 7)
2. [ ] Add `SLUG_REGEX` constant at module scope (line 8)
3. [ ] Create `generateHeadingId()` helper function at module scope
4. [ ] Update `code` component to use `LANGUAGE_REGEX` (line 41)
5. [ ] Update `h1`, `h2`, `h3` components to use `generateHeadingId()` (lines 64-84)

## Related Patterns

- Rule: `.claude/skills/vercel-react-best-practices/rules/js-hoist-regexp.md`
