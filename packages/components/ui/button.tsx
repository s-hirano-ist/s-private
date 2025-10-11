import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../utils/cn";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-linear-to-r from-primary to-primary-grad text-white shadow-sm hover:bg-primary/40",
				destructive:
					"bg-destructive text-white shadow-xs hover:bg-destructive/80",
				outline:
					"border border-muted bg-background shadow-xs hover:bg-muted hover:text-muted-foreground",
				secondary: "bg-muted text-muted-foreground shadow-xs hover:bg-muted/80",
				ghost: "hover:text-primary",
				link: "text-white underline-offset-4 hover:underline",
				navSide: "hover:bg-black/40 dark:hover:bg-gray-800",
				navCenter: "bg-white font-medium hover:bg-black/40",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-10 rounded-md px-8",
				icon: "size-9",
				navSide: "size-full",
				navCenter: "size-14 rounded-full",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type ButtonProps = {
	asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? SlotPrimitive.Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
