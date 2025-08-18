import z from "zod";
import {
	type Id,
	makeId,
	Status,
	type UserId,
} from "@/domains/common/entities/common-entity";

// NOTE: sync with s-contents/update-db.ts
export const THUMBNAIL_WIDTH = 192;
export const THUMBNAIL_HEIGHT = 192;

// Value objects

export const Path = z.string().min(1).brand<"Path">();
export type Path = z.infer<typeof Path>;
export const makePath = (v: string): Path => Path.parse(v);

export const ContentType = z
	.string()
	.regex(/^image\/[a-z0-9.+-]+$/i)
	.brand<"ContentType">();
export type ContentType = z.infer<typeof ContentType>;
export const makeContentType = (v: string): ContentType => ContentType.parse(v);

export const FileSize = z.number().int().nonnegative().brand<"FileSize">();
export type FileSize = z.infer<typeof FileSize>;
export const makeFileSize = (v: number): FileSize => FileSize.parse(v);

export const Pixel = z.number().int().positive().brand<"Pixel">();
export type Pixel = z.infer<typeof Pixel>;
export const makePixel = (v: number): Pixel => Pixel.parse(v);

export const Tag = z.string().min(1).brand<"Tag">();
export type Tag = z.infer<typeof Tag>;
export const makeTag = (v: string): Tag => Tag.parse(v);

export const Description = z.string().min(1).brand<"Description">();
export type Description = z.infer<typeof Description>;
export const makeDescription = (v: string): Description => Description.parse(v);

// Entities

export type Image = Readonly<{
	id: Id;
	userId: UserId;
	path: Path;
	contentType: ContentType;
	fileSize?: FileSize | null;
	width?: Pixel | null;
	height?: Pixel | null;
	tags?: Array<Tag>;
	description?: Description | null;
	status: Status;
}>;

export type CreateImageArgs = Readonly<{
	userId: UserId;
	path: Path;
	contentType: ContentType;
	fileSize?: FileSize | null;
	width?: Pixel | null;
	height?: Pixel | null;
	tags?: Array<Tag>;
	description?: Description | null;
}>;

export const imageDomainService = {
	create: (args: CreateImageArgs): Image => {
		return Object.freeze({
			id: makeId(),
			status: Status.parse("UNEXPORTED"),
			...args,
		});
	},
};
