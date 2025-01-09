type StatusCode = "000" | "204" | "403" | "404" | "500";

export function StatusCodeView({ statusCode }: { statusCode: StatusCode }) {
	const statusMessage = () => {
		switch (statusCode) {
			case "000":
				return "Comming Soon";
			case "204":
				return "No Content";
			case "403":
				return "Forbidden";
			case "404":
				return "Not Found";
			case "500":
				return "Internal Server Error";
			default:
				statusCode satisfies never;
				return "Unknown Status";
		}
	};

	return (
		<div
			className="w-full bg-gradient-to-r from-primary-grad-from to-primary-grad-to bg-clip-text p-2 text-center font-extrabold text-transparent"
			data-testid="status-code-view"
		>
			<div className="text-9xl">
				<span className="hidden font-light sm:inline">---</span>
				{String(statusCode)}
				<span className="hidden font-light sm:inline">---</span>
			</div>
			<div className="text-sm">------{statusMessage()}------</div>
		</div>
	);
}
