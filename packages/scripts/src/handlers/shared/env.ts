import { z } from "zod";

const baseEnvSchema = z.object({
	DATABASE_URL: z.string(),
	PUSHOVER_URL: z.string(),
	PUSHOVER_USER_KEY: z.string(),
	PUSHOVER_APP_TOKEN: z.string(),
	USERNAME_TO_EXPORT: z.string(),
});

const minioEnvSchema = baseEnvSchema.extend({
	MINIO_HOST: z.string(),
	MINIO_PORT: z.string(),
	MINIO_BUCKET_NAME: z.string(),
	MINIO_ACCESS_KEY: z.string(),
	MINIO_SECRET_KEY: z.string(),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type MinioEnv = z.infer<typeof minioEnvSchema>;

export function getBaseEnv(): BaseEnv {
	return baseEnvSchema.parse(process.env);
}

export function getMinioEnv(): MinioEnv {
	return minioEnvSchema.parse(process.env);
}
