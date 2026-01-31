import { NextResponse } from "next/server";

// Note: edge runtime removed for cacheComponents compatibility in Next.js 16
export async function GET() {
	return NextResponse.json({ status: "ok" });
}
