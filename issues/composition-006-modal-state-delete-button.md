# Issue: Modal State Management in DeleteButtonWithModal

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `state-lift-state` |
| **Priority** | LOW |
| **Impact** | HIGH (rule impact) - enables state sharing outside component boundaries |
| **Affected File** | `app/src/components/common/forms/actions/delete-button-with-modal.tsx` |

## Problem Description

The `DeleteButtonWithModal` component manages `isOpen` and `isDeleting` states with separate `useState` hooks. While this works, it could be improved with consolidated state management.

### Current Code

```tsx
export function DeleteButtonWithModal({ id, title, deleteAction }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const label = useTranslations("label");
  const message = useTranslations("message");

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteAction(id);
      toast(message(response.message));
      setIsOpen(false);
    } catch {
      toast.error(message("error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isDeleting) {
      setIsOpen(open);
    }
  };

  return (
    <>
      <Button
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        // ...
      >
        <TrashIcon className="size-4" />
      </Button>

      <Dialog onOpenChange={handleOpenChange} open={isOpen}>
        <DialogContent>
          {/* ... */}
          <DialogFooter>
            <Button
              disabled={isDeleting}
              onClick={() => setIsOpen(false)}
              variant="outline"
            >
              {label("cancel")}
            </Button>
            <Button
              disabled={isDeleting}
              onClick={handleDelete}
              variant="destructive"
            >
              {label("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Issues (Minor)

1. **Related states managed separately**: `isOpen` and `isDeleting` are related but managed independently
2. **Implicit state machine**: The valid state combinations are:
   - `isOpen: false, isDeleting: false` - closed
   - `isOpen: true, isDeleting: false` - open, idle
   - `isOpen: true, isDeleting: true` - open, deleting
   - `isOpen: false, isDeleting: true` - invalid (shouldn't happen)

## Proposed Solution (Optional)

### Option 1: useReducer for State Machine

```tsx
type ModalState =
  | { status: 'closed' }
  | { status: 'open' }
  | { status: 'deleting' };

type ModalAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'START_DELETE' }
  | { type: 'DELETE_COMPLETE' }
  | { type: 'DELETE_ERROR' };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN':
      return { status: 'open' };
    case 'CLOSE':
      if (state.status === 'deleting') return state; // Can't close while deleting
      return { status: 'closed' };
    case 'START_DELETE':
      return { status: 'deleting' };
    case 'DELETE_COMPLETE':
    case 'DELETE_ERROR':
      return { status: 'closed' };
    default:
      return state;
  }
}

export function DeleteButtonWithModal({ id, title, deleteAction }: Props) {
  const [state, dispatch] = useReducer(modalReducer, { status: 'closed' });

  const label = useTranslations("label");
  const message = useTranslations("message");

  const handleDelete = async () => {
    try {
      dispatch({ type: 'START_DELETE' });
      const response = await deleteAction(id);
      toast(message(response.message));
      dispatch({ type: 'DELETE_COMPLETE' });
    } catch {
      toast.error(message("error"));
      dispatch({ type: 'DELETE_ERROR' });
    }
  };

  const isOpen = state.status !== 'closed';
  const isDeleting = state.status === 'deleting';

  return (
    <>
      <Button
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dispatch({ type: 'OPEN' });
        }}
        // ...
      >
        <TrashIcon className="size-4" />
      </Button>

      <Dialog
        onOpenChange={(open) => dispatch({ type: open ? 'OPEN' : 'CLOSE' })}
        open={isOpen}
      >
        {/* ... same content ... */}
      </Dialog>
    </>
  );
}
```

### Option 2: Keep Current (Acceptable)

The current implementation is simple and works correctly. The component:
- Has clear separation between button and modal
- State is localized and doesn't need to be shared
- Invalid state (`isOpen: false, isDeleting: true`) is prevented by the `finally` block

## Assessment

**Status**: OPTIONAL / LOW PRIORITY

This is a minor improvement. The current two-state approach is:
- Easy to understand
- Works correctly
- Doesn't violate the "lift state" rule since no external components need access

The `state-lift-state` rule is about lifting state when **sibling components need access**. In this case, the button and modal are tightly coupled and managed in the same component.

### When to Apply This Pattern

Consider the `useReducer` approach if:
- Adding more states (e.g., confirmation step, error state with retry)
- Need to prevent invalid state combinations
- Want explicit state machine documentation

## Implementation Steps (If Proceeding)

1. [ ] Define `ModalState` and `ModalAction` types
2. [ ] Implement `modalReducer`
3. [ ] Replace `useState` calls with `useReducer`
4. [ ] Derive boolean flags from state

## Related Patterns

- Rule: `.claude/skills/vercel-composition-patterns/rules/state-lift-state.md`
- Related: `architecture-compound-components.md` (if modal needs to be composed)
