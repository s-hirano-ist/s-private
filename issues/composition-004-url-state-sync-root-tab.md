# Issue: URL State Synchronization in RootTab

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `state-decouple-implementation` |
| **Priority** | MEDIUM |
| **Impact** | MEDIUM - enables swapping state implementations without changing UI |
| **Affected File** | `app/src/components/common/layouts/nav/root-tab.tsx` |

## Problem Description

The `RootTab` component duplicates URL searchParams into React state and synchronizes them with `useEffect`. This is the same pattern issue as in `footer.tsx`.

### Current Code

```tsx
function RootTabComponent({ articles, books, notes, images }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State duplicates searchParams - BAD
  const [tab, setTab] = useState(searchParams.get("tab") ?? DEFAULT_TAB);
  const [isPending, startTransition] = useTransition();

  // Handler updates both state AND URL
  const handleTabChange = useCallback(
    (value: string) => {
      // Optimistic UI update
      setTab(value);

      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        params.set("tab", value);
        router.replace(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  // Effect syncs URL back to state
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (!currentTab) return;

    if (!TAB_KEYS.has(currentTab)) {
      const params = new URLSearchParams(searchParams);
      params.delete("tab");
      router.replace(`?${params.toString()}`);
      setTab(DEFAULT_TAB);
    } else if (currentTab !== tab) {
      setTab(currentTab);
    }
  }, [searchParams, router, tab]);

  return (
    <Tabs
      className="mx-auto max-w-5xl sm:px-2"
      defaultValue={DEFAULT_TAB}
      onValueChange={handleTabChange}
      value={tab}
    >
      {/* ... */}
    </Tabs>
  );
}
```

### Issues

1. **Two sources of truth**: `tab` state and `searchParams.get("tab")`
2. **Sync complexity**: `useEffect` to sync URL -> state, handler syncs state -> URL
3. **Potential race conditions**: Back/forward navigation may cause inconsistencies
4. **Unnecessary re-renders**: State updates when URL already reflects the same value

## Proposed Solution

Treat URL searchParams as the single source of truth. Derive tab value directly from searchParams.

### Refactored Code

```tsx
function RootTabComponent({ articles, books, notes, images }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Derive tab from searchParams - single source of truth
  const tab = useMemo(() => {
    const param = searchParams.get("tab");
    if (param && TAB_KEYS.has(param)) {
      return param;
    }
    return DEFAULT_TAB;
  }, [searchParams]);

  // Prefetch all tab routes on component mount
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams);
    Object.keys(TABS).forEach((tabKey) => {
      if (tabKey !== tab) {
        const prefetchParams = new URLSearchParams(currentParams);
        prefetchParams.set("tab", tabKey);
        prefetchParams.delete("page");
        router.prefetch(`?${prefetchParams.toString()}`);
      }
    });
  }, [router, searchParams, tab]);

  const handleTabChange = useCallback(
    (value: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        params.set("tab", value);
        router.replace(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  // Redirect invalid tab values
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab && !TAB_KEYS.has(currentTab)) {
      const params = new URLSearchParams(searchParams);
      params.delete("tab");
      router.replace(`?${params.toString()}`);
    }
  }, [searchParams, router]);

  const tabsList = useMemo(
    () => (
      <TabsList className={cn("w-full", isPending && "opacity-50")}>
        {Object.entries(TABS).map(([key, value]) => {
          return (
            <TabsTrigger
              className="w-full"
              disabled={isPending}
              key={key}
              value={key}
            >
              {value}
            </TabsTrigger>
          );
        })}
      </TabsList>
    ),
    [isPending],
  );

  return (
    <Tabs
      className="mx-auto max-w-5xl sm:px-2"
      defaultValue={DEFAULT_TAB}
      onValueChange={handleTabChange}
      value={tab}
    >
      {tabsList}
      <TabsContent value="articles">{articles}</TabsContent>
      <TabsContent value="notes">{notes}</TabsContent>
      <TabsContent value="books">{books}</TabsContent>
      <TabsContent value="images">{images}</TabsContent>
    </Tabs>
  );
}
```

### Key Changes

1. **Single source of truth**: `tab` is derived from `searchParams` via `useMemo`
2. **No optimistic state**: Removed `setTab(value)` before URL update
3. **Simplified sync**: Only one effect for invalid value redirect
4. **Cleaner mental model**: URL is the truth, UI reflects URL

### Trade-off: Optimistic UI

If tab switching feels sluggish without optimistic updates:

```tsx
// Option: Use useOptimistic for optimistic UI
const [optimisticTab, setOptimisticTab] = useOptimistic(tab);

const handleTabChange = useCallback(
  (value: string) => {
    setOptimisticTab(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("tab", value);
      router.replace(`?${params.toString()}`);
    });
  },
  [router, searchParams, setOptimisticTab],
);

// Use optimisticTab for Tabs value prop
<Tabs value={optimisticTab} ... />
```

## Implementation Steps

1. [ ] Replace `useState(tab)` with `useMemo` derivation from searchParams
2. [ ] Remove optimistic `setTab` call OR replace with `useOptimistic`
3. [ ] Simplify useEffect to only handle invalid value redirect
4. [ ] Test tab switching behavior and back/forward navigation

## Note

This issue is nearly identical to `composition-003-url-state-sync-footer.md`. Consider implementing both at the same time to ensure consistent patterns across the codebase.

## Related Patterns

- Rule: `.claude/skills/vercel-composition-patterns/rules/state-decouple-implementation.md`
- Related: `rerender-derived-state.md` from vercel-react-best-practices
- Related Issue: `composition-003-url-state-sync-footer.md`
