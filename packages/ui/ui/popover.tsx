"use client";

import type * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cnWithState } from "../utils/cn";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

type PopoverContentProps = {
	positionerProps?: React.ComponentProps<typeof PopoverPrimitive.Positioner>;
} & React.ComponentProps<typeof PopoverPrimitive.Popup>;

function PopoverContent({
	className,
	positionerProps,
	...props
}: PopoverContentProps) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner
				align="center"
				sideOffset={4}
				{...positionerProps}
			>
				<PopoverPrimitive.Popup
					className={cnWithState(
						className,
						"z-50 w-72 rounded-md border bg-background p-4 text-foreground shadow-md outline-hidden transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
					)}
					data-slot="popover-content"
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}

export { Popover, PopoverContent, PopoverTrigger };
