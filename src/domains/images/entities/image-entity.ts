import sharp from "sharp";
import z, { ZodError } from "zod";
import {
	InvalidFormatError,
	UnexpectedError,
} from "@/common/error/error-classes";
import {
	Id,
	makeId,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import { idGenerator } from "@/domains/common/services/id-generator";

// NOTE: sync with s-contents/update-db.ts
const THUMBNAIL_WIDTH = 192;
const THUMBNAIL_HEIGHT = 192;

// Value objects

export const Path = z.string().min(1).brand<"Path">();
export type Path = z.infer<typeof Path>;
export const makePath = (v: string): Path => {
	const sanitizedFileName = v.replaceAll(/[^a-zA-Z0-9._-]/g, "");
	const path = `${idGenerator.uuidv7()}-${sanitizedFileName}`;
	return Path.parse(path);
};

export const ContentType = z
	.enum(["image/jpeg", "image/png", "image/gif"])
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

export type OriginalBuffer = Buffer<ArrayBufferLike>;
export const makeOriginalBuffer = async (file: File) => {
	return Buffer.from(await file.arrayBuffer());
};

export type ThumbnailBuffer = Buffer<ArrayBufferLike>;
export const makeThumbnailBuffer = async (file: File) => {
	const originalBuffer = Buffer.from(await file.arrayBuffer());
	return await sharp(originalBuffer)
		.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
		.toBuffer();
};

// Entities

export const image = z.object({
	id: Id,
	userId: UserId,
	path: Path,
	contentType: ContentType,
	fileSize: FileSize,
	width: Pixel,
	height: Pixel,
	tags: z.array(Tag).optional(),
	description: Description,
	status: Status,
});
export type Image = z.infer<typeof image>;

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
	create: (args: CreateImageArgs): Image => {
		try {
			return Object.freeze({
				id: makeId(),
				status: Status.parse("UNEXPORTED"),
				...args,
			});
		} catch (error) {
			if (error instanceof ZodError) throw new InvalidFormatError();
			throw new UnexpectedError();
		}
	},
};
