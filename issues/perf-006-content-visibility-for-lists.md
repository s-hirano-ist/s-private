# Issue: Add content-visibility CSS optimization for large lists

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `rendering-content-visibility` |
| **Priority** | HIGH |
| **Impact** | Up to 10x faster initial render for long lists by deferring off-screen rendering |
| **Affected Files** | `app/src/components/common/layouts/cards/base-card-stack.tsx`, `app/src/components/common/display/image/image-stack.tsx` |

## Problem Description

Large lists rendered with `.map()` do not use CSS `content-visibility: auto` optimization. This property tells the browser to skip rendering off-screen content, significantly improving initial render performance for lists with many items.

### Current Code

**base-card-stack.tsx (lines 80-93):**
```tsx
<div className={gridClassName}>
    {allData.map((item, index) => {
        const isLast = index === allData.length - 1;
        const itemKey = "key" in item ? item.key : item.id;
        return children({
            item,
            index,
            isLast,
            lastElementRef,
            deleteAction,
            itemKey,
        });
    })}
</div>
```

### Issues

1. All items in the grid are fully rendered on initial load, even if they are off-screen
2. Infinite scroll loads more items progressively, but already-rendered items don't benefit from visibility optimization
3. Browser wastes resources computing layout and paint for items not visible in the viewport

## Proposed Solution

Apply `content-visibility: auto` with `contain-intrinsic-size` to list items. This can be done by:
1. Adding a wrapper class with the CSS property
2. Or applying inline styles to rendered items

### Option 1: CSS Class (Recommended)

Add to global CSS or Tailwind config:
```css
.content-auto {
    content-visibility: auto;
    contain-intrinsic-size: auto 200px; /* Estimated height */
}
```

Then apply to the grid container or individual items.

### Option 2: Update Card Components

Each card component (LinkCard, ImageCard) should include the optimization:

```tsx
// In link-card.tsx or image-card.tsx
<div
    className="..."
    style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 200px'
    }}
>
    {/* card content */}
</div>
```

### Option 3: Tailwind Plugin

If using Tailwind, add custom utilities:
```js
// tailwind.config.js
module.exports = {
    theme: {
        extend: {},
    },
    plugins: [
        function({ addUtilities }) {
            addUtilities({
                '.content-visibility-auto': {
                    'content-visibility': 'auto',
                    'contain-intrinsic-size': 'auto 200px',
                },
            })
        },
    ],
}
```

## Implementation Steps

1. [ ] Choose implementation approach (CSS class, inline styles, or Tailwind plugin)
2. [ ] Add `content-visibility: auto` to card items in `base-card-stack.tsx`
3. [ ] Add `content-visibility: auto` to image items in `image-stack.tsx`
4. [ ] Add `contain-intrinsic-size` with appropriate estimated dimensions
5. [ ] Test scrolling behavior to ensure smooth experience
6. [ ] Verify no layout shifts occur with the optimization

## Related Patterns

- Rule: `.claude/skills/vercel-react-best-practices/rules/rendering-content-visibility.md`
