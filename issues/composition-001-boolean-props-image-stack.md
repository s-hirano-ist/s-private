# Issue: Boolean Props in ImageStack

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `architecture-avoid-boolean-props` |
| **Priority** | HIGH |
| **Impact** | CRITICAL - prevents unmaintainable component variants |
| **Affected File** | `app/src/components/common/display/image/image-stack.tsx` |

## Problem Description

The `ImageStack` component uses a boolean prop `showDeleteButton` to conditionally render the delete button. This creates implicit variants and couples display logic with prop flags.

### Current Code

```tsx
type Props = {
  data: ImageData[];
  showDeleteButton: boolean;
  deleteAction?: DeleteAction;
};

export function ImageStack({ data, showDeleteButton, deleteAction }: Props) {
  // ...
  return (
    <>
      <div className="grid grid-cols-4 gap-2 p-2 sm:p-4">
        {data.map((image, i) => (
          <div className="relative" key={image.id || image.originalPath}>
            {/* ... image display ... */}
            {showDeleteButton && deleteAction !== undefined && image.id && (
              <DeleteButtonWithModal
                deleteAction={deleteAction}
                id={image.id}
                title={image.originalPath}
              />
            )}
          </div>
        ))}
      </div>
      <Lightbox ... />
    </>
  );
}
```

### Issues

1. Boolean prop creates implicit component variants
2. Conditional logic inside component instead of explicit composition
3. `deleteAction` prop becomes optional and needs runtime checks
4. Adding more variants (e.g., `showEditButton`, `showShareButton`) would exponentially increase complexity

## Proposed Solution

Create explicit variant components using composition pattern.

### Refactored Code

```tsx
// Base ImageStack - display only
type ImageStackProps = {
  data: ImageData[];
};

export function ImageStack({ data }: ImageStackProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const t = useTranslations("statusCode");

  if (data.length === 0)
    return <StatusCodeView statusCode="204" statusCodeString={t("204")} />;

  const slides: SlideImage[] = data.map((image) => ({
    src: image.originalPath,
    width: image.width || undefined,
    height: image.height || undefined,
    alt: `Image ${image.originalPath}`,
  }));

  const handleImageClick = (imageIndex: number) => {
    setIndex(imageIndex);
    setOpen(true);
  };

  return (
    <>
      <ImageStackGrid
        data={data}
        onImageClick={handleImageClick}
      />
      <Lightbox
        close={() => setOpen(false)}
        index={index}
        open={open}
        slides={slides}
      />
    </>
  );
}

// Shared grid component
type ImageStackGridProps = {
  data: ImageData[];
  onImageClick: (index: number) => void;
  renderOverlay?: (image: ImageData) => React.ReactNode;
};

function ImageStackGrid({ data, onImageClick, renderOverlay }: ImageStackGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-2 sm:p-4">
      {data.map((image, i) => (
        <div className="relative" key={image.id || image.originalPath}>
          <ImageClickable
            image={image}
            onImageClick={() => onImageClick(i)}
          />
          {renderOverlay?.(image)}
        </div>
      ))}
    </div>
  );
}

// Editable variant with delete functionality
type EditableImageStackProps = {
  data: ImageData[];
  deleteAction: DeleteAction;
};

export function EditableImageStack({ data, deleteAction }: EditableImageStackProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const t = useTranslations("statusCode");

  if (data.length === 0)
    return <StatusCodeView statusCode="204" statusCodeString={t("204")} />;

  const slides: SlideImage[] = data.map((image) => ({
    src: image.originalPath,
    width: image.width || undefined,
    height: image.height || undefined,
    alt: `Image ${image.originalPath}`,
  }));

  return (
    <>
      <ImageStackGrid
        data={data}
        onImageClick={(i) => {
          setIndex(i);
          setOpen(true);
        }}
        renderOverlay={(image) =>
          image.id ? (
            <DeleteButtonWithModal
              deleteAction={deleteAction}
              id={image.id}
              title={image.originalPath}
            />
          ) : null
        }
      />
      <Lightbox
        close={() => setOpen(false)}
        index={index}
        open={open}
        slides={slides}
      />
    </>
  );
}
```

## Implementation Steps

1. [ ] Extract shared `ImageStackGrid` component
2. [ ] Create base `ImageStack` component without delete functionality
3. [ ] Create `EditableImageStack` variant with delete functionality
4. [ ] Update all usages:
   - `showDeleteButton={false}` -> `<ImageStack />`
   - `showDeleteButton={true}` -> `<EditableImageStack />`
5. [ ] Remove boolean prop from API

## Related Patterns

- Rule: `.claude/skills/vercel-composition-patterns/rules/architecture-avoid-boolean-props.md`
- See also: `patterns-explicit-variants.md`
