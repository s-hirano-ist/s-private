import { Loader } from "lucide-react";
import React from "react";

const Loading: React.FC = () => {
	return (
		<div className="flex h-full items-center justify-center p-16">
			<Loader className="animate-spin text-primary" size={48} />
		</div>
	);
};

export default Loading;
