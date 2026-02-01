# Issue: State Duplication in GenericFormWrapper

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `state-decouple-implementation` |
| **Priority** | MEDIUM |
| **Impact** | MEDIUM - enables swapping state implementations without changing UI |
| **Affected File** | `packages/ui/forms/generic-form-wrapper.tsx` |

## Problem Description

The `GenericFormWrapper` component duplicates `preservedValues` prop into local state and synchronizes them during render. This creates two sources of truth and requires manual sync logic.

### Current Code

```tsx
export function GenericFormWrapper<T>({
  action,
  children,
  preservedValues,
  // ...
}: GenericFormWrapperProps<T>) {
  // State duplicates preservedValues prop - needs sync
  const [formValues, setFormValues] = useState<Record<string, string>>(
    preservedValues || {},
  );
  const [prevPreservedValues, setPrevPreservedValues] =
    useState(preservedValues);

  // Manual sync during render
  if (preservedValues !== prevPreservedValues) {
    setPrevPreservedValues(preservedValues);
    if (preservedValues) {
      setFormValues(preservedValues);
    }
  }

  // ... rest of component
}
```

### Issues

1. **Two sources of truth**: `formValues` state and `preservedValues` prop
2. **Manual sync pattern**: `prevPreservedValues` tracking pattern to detect changes
3. **Unnecessary state**: If `preservedValues` changes, we need to sync it to `formValues`
4. **Complex mental model**: When is `formValues` different from `preservedValues`?

## Analysis

The `formValues` state serves two purposes:
1. **Initial values**: Restored from `preservedValues` on mount or prop change
2. **Error preservation**: Updated from server response when form submission fails

The core question: Is local state actually needed, or can we derive from props + server state?

## Proposed Solution

### Option 1: Use useMemo for Derived State

If `formValues` only needs to reflect `preservedValues` or server response:

```tsx
export function GenericFormWrapper<T>({
  action,
  children,
  preservedValues,
  afterSubmit,
  // ...
}: GenericFormWrapperProps<T>) {
  const [serverFormData, setServerFormData] = useState<Record<string, string> | null>(null);

  // Derive form values: server response takes precedence, then preserved values
  const formValues = useMemo(() => {
    if (serverFormData) return serverFormData;
    return preservedValues || {};
  }, [serverFormData, preservedValues]);

  const submitForm = async (
    _previousState: T | null,
    formData: FormData,
  ): Promise<T | null> => {
    const response = await action(formData);
    afterSubmit(response.message);

    if (response.success) {
      setServerFormData(null); // Clear on success
      return response;
    }

    // Preserve form data on error
    if ("formData" in response && response.formData) {
      setServerFormData(response.formData as Record<string, string>);
    }
    return response;
  };

  const [_, submitAction, isPending] = useActionState(submitForm, null);

  return (
    <FormValuesContext.Provider value={formValues}>
      {/* ... */}
    </FormValuesContext.Provider>
  );
}
```

### Key Changes

1. **Single purpose state**: `serverFormData` only stores error response data
2. **Derived values**: `formValues` computed from `serverFormData` or `preservedValues`
3. **No sync logic**: No need for `prevPreservedValues` comparison

### Option 2: Keep Current (If Intentional)

The current pattern may be intentional if:
- `formValues` needs to be mutable independent of `preservedValues`
- There are use cases where `preservedValues` updates should NOT override local edits

If this is the case, document the rationale.

## Implementation Steps

1. [ ] Analyze all usages of `GenericFormWrapper` to understand when `preservedValues` changes
2. [ ] Determine if local state mutation independent of props is needed
3. [ ] If not needed:
   - [ ] Replace dual state with derived `useMemo`
   - [ ] Remove `prevPreservedValues` comparison
4. [ ] If needed: Document the rationale in code comments

## Related Patterns

- Rule: `.claude/skills/vercel-composition-patterns/rules/state-decouple-implementation.md`
- Related: `composition-005-form-state-coupling-dropdown.md` (similar pattern in child component)
