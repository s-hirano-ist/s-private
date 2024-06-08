import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Dump to GitHub",
	description: "Dump blog data to GitHub",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja">
			<body className={inter.className}>
				<main className="flex min-h-screen flex-col items-center justify-between p-24">
					{children}
					<Toaster />
				</main>
			</body>
		</html>
	);
}
