# Issue: useEffect for Ref Synchronization in FormInputWithButton

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `state-decouple-implementation` |
| **Priority** | LOW |
| **Impact** | MEDIUM - enables swapping state implementations without changing UI |
| **Affected File** | `packages/ui/forms/fields/form-input-with-button.tsx` |

## Problem Description

The `FormInputWithButton` component uses `useEffect` to synchronize preserved form values to an input ref. This creates a side-effect-based sync pattern that can lead to timing issues.

### Current Code

```tsx
export function FormInputWithButton({
  label,
  htmlFor,
  buttonIcon,
  onButtonClick,
  inputRef,
  buttonTestId,
  defaultValue,
  ...inputProps
}: FormInputWithButtonProps) {
  const formValues = useFormValues();
  const preservedValue = formValues[inputProps.name || htmlFor];

  // useEffect to sync preserved value to ref
  useEffect(() => {
    if (preservedValue && inputRef?.current) {
      inputRef.current.value = preservedValue;
    }
  }, [preservedValue, inputRef]);

  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="flex">
        <Input
          defaultValue={preservedValue || defaultValue}
          id={htmlFor}
          ref={inputRef}
          {...inputProps}
        />
        {/* ... */}
      </div>
    </div>
  );
}
```

### Issues

1. **Redundant sync**: Both `defaultValue` and `useEffect` try to set the input value
2. **Timing dependency**: `useEffect` runs after render, creating a flash of old value
3. **Ref mutation side effect**: Imperatively setting `ref.current.value` outside React's control
4. **Dual initialization**: `defaultValue={preservedValue || defaultValue}` + `useEffect` sync

## Analysis

The `useEffect` sync appears to handle the case where:
1. Component is already mounted
2. `preservedValue` changes (e.g., form submission error restores values)
3. `defaultValue` only works on initial mount

However, this creates a timing issue where the input briefly shows the old value before the effect runs.

## Proposed Solution

### Option 1: Use key to Force Re-mount

Force the input to re-mount when `preservedValue` changes:

```tsx
export function FormInputWithButton({
  label,
  htmlFor,
  inputRef,
  defaultValue,
  ...inputProps
}: FormInputWithButtonProps) {
  const formValues = useFormValues();
  const fieldName = inputProps.name || htmlFor;
  const preservedValue = formValues[fieldName];

  // No useEffect needed - key change forces re-mount with new defaultValue
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="flex">
        <Input
          key={preservedValue} // Force re-mount when value changes
          defaultValue={preservedValue || defaultValue}
          id={htmlFor}
          ref={inputRef}
          {...inputProps}
        />
        {/* ... */}
      </div>
    </div>
  );
}
```

### Option 2: Controlled Input

Convert to a controlled input if the parent needs to track value:

```tsx
export function FormInputWithButton({
  label,
  htmlFor,
  inputRef,
  defaultValue,
  value: controlledValue,
  onChange,
  ...inputProps
}: FormInputWithButtonProps) {
  const formValues = useFormValues();
  const fieldName = inputProps.name || htmlFor;
  const preservedValue = formValues[fieldName];

  // Use controlled value if provided, otherwise preserved/default
  const inputValue = controlledValue ?? preservedValue ?? defaultValue ?? "";

  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="flex">
        <Input
          value={inputValue}
          onChange={onChange}
          id={htmlFor}
          ref={inputRef}
          {...inputProps}
        />
        {/* ... */}
      </div>
    </div>
  );
}
```

### Option 3: Remove useEffect (Simplest)

If `preservedValue` only changes after form errors (page refresh scenario), `defaultValue` alone may be sufficient:

```tsx
export function FormInputWithButton({
  label,
  htmlFor,
  inputRef,
  defaultValue,
  ...inputProps
}: FormInputWithButtonProps) {
  const formValues = useFormValues();
  const fieldName = inputProps.name || htmlFor;
  const preservedValue = formValues[fieldName];

  // defaultValue handles initial mount; no runtime sync needed
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="flex">
        <Input
          defaultValue={preservedValue || defaultValue}
          id={htmlFor}
          ref={inputRef}
          {...inputProps}
        />
        {/* ... */}
      </div>
    </div>
  );
}
```

## Implementation Steps

1. [ ] Test form error scenarios to understand when `preservedValue` updates
2. [ ] Determine if the `useEffect` sync is actually necessary
3. [ ] If sync is needed:
   - [ ] Consider Option 1 (key-based re-mount) for simplicity
4. [ ] If sync is not needed:
   - [ ] Remove `useEffect` (Option 3)
5. [ ] Remove `inputRef` from dependency array if keeping effect

## Related Patterns

- Rule: `.claude/skills/vercel-composition-patterns/rules/state-decouple-implementation.md`
- Related: `composition-007-state-sync-generic-form-wrapper.md` (parent component issue)
