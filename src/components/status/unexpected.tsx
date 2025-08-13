"use client";
import { useEffect } from "react";
import { loggerError } from "@/pino";
import { StatusCodeView } from "./status-code-view";

type Props = {
	caller: string;
	error: unknown;
};

export function Unexpected({ caller, error }: Props) {
	useEffect(() => {
		loggerError("unexpected", { caller: caller, status: 500 }, error);
		// eslint-disable-next-line
	}, []);

	return (
		<div className="flex flex-col items-center">
			<StatusCodeView statusCode="500" />
		</div>
	);
}
