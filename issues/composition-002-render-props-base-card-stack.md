# Issue: Render Props in BaseCardStack

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `patterns-children-over-render-props` |
| **Priority** | MEDIUM |
| **Impact** | MEDIUM - cleaner composition, better readability |
| **Affected File** | `app/src/components/common/layouts/cards/base-card-stack.tsx` |

## Problem Description

The `BaseCardStackWrapper` component uses a `renderCard` prop (render props pattern) instead of composing with children.

### Current Code

```tsx
export type RenderCardProps<T> = {
  item: T;
  index: number;
  isLast: boolean;
  lastElementRef: (node: HTMLElement | null) => void;
  deleteAction?: DeleteAction;
  itemKey: string;
};

type BaseCardStackProps<T extends SearchableItem> = {
  initial: CardStackInitialData<T>;
  deleteAction?: DeleteAction;
  loadMoreAction: LoadMoreAction<CardStackInitialData<T>>;
  renderCard: (props: RenderCardProps<T>) => React.ReactNode;
  gridClassName: string;
};

export function BaseCardStackWrapper<T extends SearchableItem>({
  initial,
  deleteAction,
  loadMoreAction,
  renderCard,
  gridClassName,
}: BaseCardStackProps<T>) {
  // ...
  return (
    <div className="px-2 py-4">
      {allData.length === 0 ? (
        <StatusCodeView statusCode="204" statusCodeString={t("204")} />
      ) : (
        <div className={gridClassName}>
          {allData.map((item, index) => {
            const isLast = index === allData.length - 1;
            const itemKey = "key" in item ? item.key : item.id;
            return renderCard({
              item,
              index,
              isLast,
              lastElementRef,
              deleteAction,
              itemKey,
            });
          })}
        </div>
      )}
      {isPending && <Loading />}
    </div>
  );
}
```

## Assessment

This is a **valid use case for render props**. According to the rule:

> Use render props when the parent needs to provide data or state to the child.
> Use children when composing static structure.

In this case:
- The parent provides `item`, `index`, `isLast`, `lastElementRef`, and `itemKey` to each card
- The infinite scroll logic requires the parent to pass `lastElementRef` to determine when to load more
- Each card needs access to data that only the parent knows

## Proposed Solution (Optional Improvement)

While the current implementation is valid, it could be improved by using a **children-as-function** pattern instead of a named `renderCard` prop, which is more idiomatic React:

```tsx
type BaseCardStackProps<T extends SearchableItem> = {
  initial: CardStackInitialData<T>;
  deleteAction?: DeleteAction;
  loadMoreAction: LoadMoreAction<CardStackInitialData<T>>;
  children: (props: RenderCardProps<T>) => React.ReactNode;
  gridClassName: string;
};

export function BaseCardStackWrapper<T extends SearchableItem>({
  initial,
  deleteAction,
  loadMoreAction,
  children,
  gridClassName,
}: BaseCardStackProps<T>) {
  // ... same logic ...
  return (
    <div className="px-2 py-4">
      {allData.length === 0 ? (
        <StatusCodeView statusCode="204" statusCodeString={t("204")} />
      ) : (
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
      )}
      {isPending && <Loading />}
    </div>
  );
}
```

### Usage Comparison

**Current (renderCard prop):**
```tsx
<BaseCardStackWrapper
  initial={data}
  loadMoreAction={loadMore}
  deleteAction={deleteAction}
  gridClassName="grid-cols-2"
  renderCard={({ item, isLast, lastElementRef }) => (
    <ArticleCard key={item.id} item={item} ref={isLast ? lastElementRef : null} />
  )}
/>
```

**Proposed (children as function):**
```tsx
<BaseCardStackWrapper
  initial={data}
  loadMoreAction={loadMore}
  deleteAction={deleteAction}
  gridClassName="grid-cols-2"
>
  {({ item, isLast, lastElementRef }) => (
    <ArticleCard key={item.id} item={item} ref={isLast ? lastElementRef : null} />
  )}
</BaseCardStackWrapper>
```

## Implementation Steps

1. [ ] Rename `renderCard` prop to `children`
2. [ ] Update type definition
3. [ ] Update all usages to use JSX children syntax

## Decision

**Status**: OPTIONAL

This is a minor readability improvement. The current `renderCard` implementation is a valid use of render props since it passes data from parent to child. Consider implementing only if refactoring this area for other reasons.

## Related Patterns

- Rule: `.claude/skills/vercel-composition-patterns/rules/patterns-children-over-render-props.md`
