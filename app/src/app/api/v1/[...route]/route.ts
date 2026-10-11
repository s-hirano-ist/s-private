import { backendApi } from "@/backend/api";
export const GET = (request: Request) => backendApi.fetch(request);
export const POST = (request: Request) => backendApi.fetch(request);
export const PUT = (request: Request) => backendApi.fetch(request);
export const DELETE = (request: Request) => backendApi.fetch(request);
export const OPTIONS = (request: Request) => backendApi.fetch(request);
