# @s-hirano-ist/s-ui

Framework-agnostic design system for React 19 applications. It provides accessible components, interaction primitives, hooks, and a compiled stylesheet. It does not contain Next.js integrations, Server Actions, application forms, content renderers, or product-specific navigation.

## Requirements

- React and React DOM 19
- A bundler that supports ESM and CSS imports, such as Vite or Next.js

## Installation

```bash
pnpm add @s-hirano-ist/s-ui react react-dom
```

Import the compiled stylesheet once at the application entry point. Tailwind CSS is not required by consumers.

```tsx
import "@s-hirano-ist/s-ui/styles.css";
```

Components are exposed through direct subpath imports. There is intentionally no root barrel export.

```tsx
import { Button } from "@s-hirano-ist/s-ui/button";
import { Field, FieldLabel } from "@s-hirano-ist/s-ui/field";
import { Input } from "@s-hirano-ist/s-ui/input";

export function ProfileForm() {
  return (
    <Field>
      <FieldLabel htmlFor="name">Name</FieldLabel>
      <Input id="name" name="name" />
      <Button type="submit">Save</Button>
    </Field>
  );
}
```

Stateful notifications are scoped to a React root.

```tsx
import { ToastProvider, useToast } from "@s-hirano-ist/s-ui/toast";

function SaveButton() {
  const toast = useToast();
  return <button onClick={() => toast.success("Saved")}>Save</button>;
}

export function App() {
  return <ToastProvider><SaveButton /></ToastProvider>;
}
```

## Theming

The default theme matches s-private. Override tokens after importing `styles.css`:

```css
:root {
  --sui-primary: 20 100 180;
  --sui-radius: 0.75rem;
}
```

Dark mode is enabled by either a `.dark` ancestor or `data-theme="dark"`. The stylesheet includes no preflight and does not style `html` or `body`. Generated utility selectors use the `sui:` prefix.

## Frameworks

Vite applications import the stylesheet in `main.tsx` before rendering:

```tsx
import "@s-hirano-ist/s-ui/styles.css";
import { createRoot } from "react-dom/client";
import { App } from "./app";

createRoot(document.getElementById("root")!).render(<App />);
```

Next.js applications import it from the root layout's global stylesheet:

```css
@import "@s-hirano-ist/s-ui/styles.css";
```

Router-aware components such as pagination accept normal anchors or a framework link through their polymorphic `as` prop. The design system itself does not import either framework.

## Development and publishing

```bash
pnpm --filter @s-hirano-ist/s-ui build
pnpm --filter @s-hirano-ist/s-ui test
pnpm storybook:ui
pnpm storybook:ui:build
pnpm storybook:ui:test
pnpm --filter @s-hirano-ist/s-ui test:consumer
pnpm --filter @s-hirano-ist/s-ui validate:package
pnpm --filter @s-hirano-ist/s-ui publish --access public
```

The build emits ESM, declaration files, source maps, and `dist/styles.css`. The source maps remain local build artifacts; the tarball contains only the README, license, JavaScript, declarations, and CSS. Run all validation commands before publishing. `publint`, Are The Types Wrong, and the Vite consumer fixture validate the publish artifact.
