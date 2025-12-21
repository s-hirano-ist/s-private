import sharp from "sharp";
import z from "zod";
import {
	CreatedAt,
	ExportedStatus,
	Id,
	makeCreatedAt,
	makeExportedStatus,
	makeId,
	UnexportedStatus,
	UserId,
} from "../../common/entities/common-entity";
import { createEntityWithErrorHandling } from "../../common/services/entity-factory";
import { idGenerator } from "../../common/services/id-generator";

// NOTE: sync with s-contents/update-db.ts
const THUMBNAIL_WIDTH = 192;
const THUMBNAIL_HEIGHT = 192;

// Value objects

export const Path = z.string().min(1).brand<"Path">();
export type Path = z.infer<typeof Path>;
export const makePath = (v: string, sanitizeAndUnique: boolean): Path => {
	if (sanitizeAndUnique) {
		const sanitizedFileName = v.replaceAll(/[^a-zA-Z0-9._-]/g, "");
		const path = `${idGenerator.uuidv7()}-${sanitizedFileName}`;
		return Path.parse(path);
	}
	return Path.parse(v);
};

export const ContentType = z
	.enum(["image/jpeg", "image/png", "image/gif", "jpeg", "png"])
	.brand<"ContentType">();
export type ContentType = z.infer<typeof ContentType>;
export const makeContentType = (v: string): ContentType => ContentType.parse(v);

export const FileSize = z
	.number()
	.int()
	.nonnegative()
	.max(100 * 1024 * 1024) // 100MB
	.brand<"FileSize">();
export type FileSize = z.infer<typeof FileSize>;
export const makeFileSize = (v: number): FileSize => FileSize.parse(v);

export const Pixel = z.number().int().positive().optional().brand<"Pixel">();
export type Pixel = z.infer<typeof Pixel>;
export const makePixel = (v: number): Pixel => Pixel.parse(v);

export const Tag = z.string().min(1).brand<"Tag">();
export type Tag = z.infer<typeof Tag>;
export const makeTag = (v: string): Tag => Tag.parse(v);

export const Description = z.string().min(1).optional().brand<"Description">();
export type Description = z.infer<typeof Description>;
export const makeDescription = (v: string): Description => Description.parse(v);

export const makeOriginalBuffer = async (file: File) => {
	return Buffer.from(await file.arrayBuffer());
};

export const makeThumbnailBufferFromFile = async (file: File) => {
	const originalBuffer = Buffer.from(await file.arrayBuffer());
	return await sharp(originalBuffer)
		.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
		.toBuffer();
};
export const makeThumbnailBufferFromBuffer = async (buffer: Buffer) => {
	return await sharp(buffer)
		.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
		.toBuffer();
};
export const makeMetadata = async (buffer: Buffer) => {
	return sharp(buffer).metadata();
};

// Entities

const Base = z.object({
	id: Id,
	userId: UserId,
	path: Path,
	contentType: ContentType,
	fileSize: FileSize,
	width: Pixel,
	height: Pixel,
	tags: z.array(Tag).optional(),
	description: Description,
	createdAt: CreatedAt,
});

export const UnexportedImage = Base.extend({ status: UnexportedStatus });
export type UnexportedImage = Readonly<z.infer<typeof UnexportedImage>>;

/** エクスポート済み画像のZodスキーマ */
export const ExportedImage = Base.extend(ExportedStatus.shape);
/** エクスポート済み画像の型 */
export type ExportedImage = Readonly<z.infer<typeof ExportedImage>>;

/** 画像作成時の引数 */
export type CreateImageArgs = Readonly<{
	userId: UserId;
	path: Path;
	contentType: ContentType;
	fileSize: FileSize;
	width?: Pixel;
	height?: Pixel;
	tags?: Array<Tag>;
	description?: Description;
}>;

export const imageEntity = {
	create: (args: CreateImageArgs): UnexportedImage => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
				...args,
			}),
		);
	},

	export: (image: UnexportedImage): ExportedImage => {
		return createEntityWithErrorHandling(() => {
			const exportedStatus = makeExportedStatus();
			return Object.freeze({
				...image,
				...exportedStatus,
			});
		});
	},
};
