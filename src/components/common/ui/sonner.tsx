"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			className="toaster group"
			duration={2000}
			theme={theme as ToasterProps["theme"]}
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-background group-[.toaster]:text-primary group-[.toaster]:shadow-lg",
					description: "group-[.toast]:text-muted-foreground",
					actionButton:
						"group-[.toast]:bg-primary-grad group-[.toast]:text-primary",
					cancelButton:
						"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
				},
			}}
			{...props}
		/>
	);
}

export { Toaster };
