export function sanitizeFileName(fileName: string) {
	return fileName.replaceAll(/[^a-zA-Z0-9._-]/g, "");
}
