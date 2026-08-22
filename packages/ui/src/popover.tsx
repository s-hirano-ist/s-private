"use client";

import type * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cnWithState } from "./utils/cn.js";

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
						"sui:z-50 sui:w-72 sui:rounded-md sui:border sui:bg-background sui:p-4 sui:text-foreground sui:shadow-md sui:outline-hidden sui:transition-[opacity,transform] sui:duration-200 sui:data-[ending-style]:scale-95 sui:data-[ending-style]:opacity-0 sui:data-[starting-style]:scale-95 sui:data-[starting-style]:opacity-0",
					)}
					data-slot="popover-content"
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}

export { Popover, PopoverContent, PopoverTrigger };
