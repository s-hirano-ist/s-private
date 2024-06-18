"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";

type Props = {
	numberOfRows: number;
	// rerender: React.DispatchWithoutAction;
	onClickPrevious?: () => void;
	previousButtonDisabled?: boolean;
	onClickNext?: () => void;
	nextButtonDisabled?: boolean;
};
export function TableFooter({
	numberOfRows,
	onClickPrevious,
	previousButtonDisabled = true,
	onClickNext,
	nextButtonDisabled = true,
}: Props) {
	return (
		<div className="flex justify-between items-center">
			<div>
				<span className="font-bold text-3xl">{numberOfRows}</span>個の項目
			</div>
			{/* <Button onClick={() => rerender()} className="border p-2">
				Rerender
			</Button> */}
			<div className="space-x-2 py-4">
				<Button
					variant="outline"
					size="sm"
					onClick={onClickPrevious}
					disabled={previousButtonDisabled}
				>
					前のページ
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onClickNext}
					disabled={nextButtonDisabled}
				>
					次のページ
				</Button>
			</div>
		</div>
	);
}