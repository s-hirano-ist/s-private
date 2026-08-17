import { Button } from "@s-hirano-ist/s-ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@s-hirano-ist/s-ui/dialog";
import "@s-hirano-ist/s-ui/styles.css";
import { ToastProvider } from "@s-hirano-ist/s-ui/toast";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
	return (
		<ToastProvider>
			<Dialog>
				<DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Portable UI</DialogTitle>
					<DialogDescription>Rendered without Next.js.</DialogDescription>
				</DialogContent>
			</Dialog>
		</ToastProvider>
	);
}

const root = document.querySelector("#root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
