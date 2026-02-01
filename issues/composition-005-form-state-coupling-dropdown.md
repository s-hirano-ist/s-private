# Issue: Form State Coupling in FormDropdownInput

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `state-decouple-implementation` |
| **Priority** | MEDIUM |
| **Impact** | MEDIUM - enables swapping state implementations without changing UI |
| **Affected File** | `packages/ui/forms/fields/form-dropdown-input.tsx` |

## Problem Description

The `FormDropdownInput` component duplicates form context values into local state and synchronizes them during render. This creates two sources of truth and adds complexity.

### Current Code

```tsx
export function FormDropdownInput({
  label,
  htmlFor,
  options,
  // ...
}: Props) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const formValues = useFormValues();
  const preservedValue = formValues[name || htmlFor];

  // Local state duplicates form context - BAD
  const [value, setValue] = useState(preservedValue ?? "");
  const [prevPreservedValue, setPrevPreservedValue] = useState(preservedValue);

  // Sync preservedValue to value during render (not in useEffect)
  if (preservedValue !== prevPreservedValue) {
    setPrevPreservedValue(preservedValue);
    if (preservedValue !== undefined) {
      setValue(preservedValue);
    }
  }

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    setSearchValue("");
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      {/* Uses local `value` state */}
      <Button ...>
        {value || placeholder || "Select..."}
      </Button>
      {/* Hidden input for form submission */}
      <input
        name={name || htmlFor}
        type="hidden"
        value={value}
      />
    </div>
  );
}
```

### Issues

1. **Two sources of truth**: `value` state and `formValues[name]`
2. **Render-time sync**: `prevPreservedValue` pattern to sync during render
3. **Complex mental model**: Which value is authoritative? Local or form context?
4. **Potential bugs**: Local state could desync from form context in edge cases

## Proposed Solution

Use the form context as the single source of truth. The component should read from context and update context directly.

### Option 1: Direct Context Usage (If FormWrapper supports it)

```tsx
export function FormDropdownInput({
  label,
  htmlFor,
  options,
  inputRef,
  placeholder,
  name,
  required,
  disabled,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
  customValueLabel = DEFAULT_CUSTOM_VALUE_LABEL,
}: Props) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { values, setValue: setFormValue } = useFormContext();
  const fieldName = name || htmlFor;
  const value = values[fieldName] ?? "";

  const handleSelect = (selectedValue: string) => {
    setFormValue(fieldName, selectedValue);
    setSearchValue("");
    setOpen(false);
  };

  const handleCustomValue = () => {
    if (searchValue) {
      setFormValue(fieldName, searchValue);
      setSearchValue("");
      setOpen(false);
    }
  };

  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
            role="combobox"
            variant="outline"
          >
            {value || placeholder || "Select..."}
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {/* ... rest of popover content ... */}
      </Popover>
      <input
        id={htmlFor}
        name={fieldName}
        ref={inputRef}
        required={required}
        type="hidden"
        value={value}
      />
    </div>
  );
}
```

### Option 2: Uncontrolled Component with Form Submission

If the form context is read-only (only for preserving values on error), consider using the hidden input as the source of truth:

```tsx
export function FormDropdownInput({
  label,
  htmlFor,
  options,
  inputRef,
  placeholder,
  name,
  required,
  disabled,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
  customValueLabel = DEFAULT_CUSTOM_VALUE_LABEL,
}: Props) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const formValues = useFormValues();
  const fieldName = name || htmlFor;

  // Initialize from form context, then manage locally
  const [value, setValue] = useState(() => formValues[fieldName] ?? "");

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    setSearchValue("");
    setOpen(false);
  };

  // ... rest unchanged
}
```

This is acceptable if:
- The form context is only used for initial value restoration after form submission errors
- The hidden input submits the current value to the form

### Recommendation

Review how `GenericFormWrapper` and `useFormValues` work:
1. If the context provides `setValue` - use Option 1 (context as single source)
2. If the context is read-only (values from last submission) - current approach may be acceptable but could be simplified

## Implementation Steps

1. [ ] Review `GenericFormWrapper` API to understand context capabilities
2. [ ] If context supports updates:
   - [ ] Remove local `value` state
   - [ ] Remove `prevPreservedValue` sync logic
   - [ ] Update handlers to use context directly
3. [ ] If context is read-only:
   - [ ] Document why local state is needed
   - [ ] Consider simplifying the sync pattern

## Related Patterns

- Rule: `.claude/skills/vercel-composition-patterns/rules/state-decouple-implementation.md`
- Related: `rerender-derived-state.md` from vercel-react-best-practices
