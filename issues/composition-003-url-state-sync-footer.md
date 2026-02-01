# Issue: URL State Synchronization in Footer

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `state-decouple-implementation` |
| **Priority** | MEDIUM |
| **Impact** | MEDIUM - enables swapping state implementations without changing UI |
| **Affected File** | `app/src/components/common/layouts/nav/footer.tsx` |

## Problem Description

The `Footer` component duplicates URL searchParams into React state and synchronizes them with `useEffect`. This creates two sources of truth and adds unnecessary complexity.

### Current Code

```tsx
function FooterComponent({ search }: Props) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State duplicates searchParams - BAD
  const [layout, setLayout] = useState(
    searchParams.get("layout") ?? DEFAULT_LAYOUT,
  );
  const [isPending, startTransition] = useTransition();

  // Handler updates both state AND URL
  const handleLayoutChange = useCallback(
    (value: string) => {
      // Optimistic UI update
      setLayout(value);

      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        params.set("layout", value);
        // ... router navigation
      });
    },
    [router, searchParams, pathname],
  );

  // Effect syncs URL back to state - creates sync issues
  useEffect(() => {
    const currentLayout = searchParams.get("layout");
    if (!currentLayout) return;

    if (!LAYOUT_KEYS.has(currentLayout)) {
      const params = new URLSearchParams(searchParams);
      params.delete("layout");
      router.replace(`?${params.toString()}`);
      setLayout(DEFAULT_LAYOUT);
    } else if (currentLayout !== layout) {
      setLayout(currentLayout);
    }
  }, [searchParams, router, layout]);

  // ...
}
```

### Issues

1. **Two sources of truth**: `layout` state and `searchParams.get("layout")`
2. **Sync complexity**: `useEffect` to sync URL -> state, handler syncs state -> URL
3. **Race conditions**: Potential issues if URL changes externally (back/forward navigation)
4. **Unnecessary re-renders**: State updates trigger re-renders even when URL is the same

## Proposed Solution

Treat URL searchParams as the single source of truth. Derive layout value directly from searchParams.

### Refactored Code

```tsx
function FooterComponent({ search }: Props) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Derive layout from searchParams - single source of truth
  const layout = useMemo(() => {
    const param = searchParams.get("layout");
    if (param && LAYOUT_KEYS.has(param)) {
      return param;
    }
    return DEFAULT_LAYOUT;
  }, [searchParams]);

  // Prefetch both layout routes on component mount
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams);
    Object.keys(LAYOUTS).forEach((layoutKey) => {
      if (layoutKey !== layout) {
        const prefetchParams = new URLSearchParams(currentParams);
        prefetchParams.set("layout", layoutKey);
        prefetchParams.delete("page");
        router.prefetch(`?${prefetchParams.toString()}`);
      }
    });
  }, [router, searchParams, layout]);

  const Icon = useCallback((name: string, icon: ReactNode) => {
    return (
      <div className="flex flex-col items-center">
        {icon}
        <div className="font-thin text-xs">{name}</div>
      </div>
    );
  }, []);

  const handleLayoutChange = useCallback(
    (value: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        params.set("layout", value);

        if (pathname.includes("/book/") || pathname.includes("/note/")) {
          const localeMatch = pathname.match(/^\/([^/]+)/);
          const locale = localeMatch ? localeMatch[1] : "";
          router.replace(`/${locale}?${params.toString()}` as Route);
        } else {
          router.replace(`?${params.toString()}` as Route);
        }
      });
    },
    [router, searchParams, pathname],
  );

  // Redirect invalid layout values
  useEffect(() => {
    const currentLayout = searchParams.get("layout");
    if (currentLayout && !LAYOUT_KEYS.has(currentLayout)) {
      const params = new URLSearchParams(searchParams);
      params.delete("layout");
      router.replace(`?${params.toString()}`);
    }
  }, [searchParams, router]);

  // ... rest of component
}
```

### Key Changes

1. **Single source of truth**: `layout` is derived from `searchParams` via `useMemo`
2. **No optimistic state**: Removed `setLayout(value)` before URL update
3. **Simplified sync**: Only one effect for invalid value redirect
4. **Cleaner mental model**: URL is the truth, UI reflects URL

### Trade-off: Optimistic UI

The current implementation uses optimistic UI (`setLayout(value)` before transition). If optimistic updates are important for perceived performance:

```tsx
// Option: Use useOptimistic for optimistic UI without state duplication
const [optimisticLayout, setOptimisticLayout] = useOptimistic(layout);

const handleLayoutChange = useCallback(
  (value: string) => {
    setOptimisticLayout(value); // Optimistic update
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("layout", value);
      router.replace(`?${params.toString()}`);
    });
  },
  [router, searchParams, setOptimisticLayout],
);
```

## Implementation Steps

1. [ ] Replace `useState(layout)` with `useMemo` derivation from searchParams
2. [ ] Remove optimistic `setLayout` call OR replace with `useOptimistic`
3. [ ] Simplify useEffect to only handle invalid value redirect
4. [ ] Update button styling to use derived `layout` value
5. [ ] Test back/forward navigation behavior

## Related Patterns

- Rule: `.claude/skills/vercel-composition-patterns/rules/state-decouple-implementation.md`
- Related: `rerender-derived-state.md` from vercel-react-best-practices
