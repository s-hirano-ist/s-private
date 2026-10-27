/**
 * Book form data parsing utilities.
 *
 * @module
 */

import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import {
	makeBookTitle,
	makeISBN,
	makeRating,
	makeTags,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import {
	makeContentType,
	makeFileSize,
	makePath,
} from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import { parseSupportedImageFile } from "s-private-backend/shared/image-upload-parser";

/**
 * Parses book creation form data into domain value objects.
 *
 * @param input - Typed book metadata and cover image
 * @param userId - Current user's ID
 * @returns Validated book data with domain value objects
 */
export const parseBookInput = async (input: BookInput, userId: UserId) => {
	const {
		isbn: isbnInput,
		title,
		rating: ratingInput,
		tags: parsedTags,
		image: file,
	} = input;

	const {
		contentType: detectedContentType,
		originalBuffer,
		thumbnailBuffer,
	} = await parseSupportedImageFile(file);
	const path = makePath(file.name, true);
	const contentType = makeContentType(detectedContentType);
	const fileSize = makeFileSize(file.size);

	return {
		isbn: makeISBN(isbnInput),
		title: makeBookTitle(title),
		rating: makeRating(ratingInput),
		tags: makeTags(parsedTags.map((tag) => tag.trim()).filter(Boolean)),
		userId,
		imagePath: path,
		path,
		contentType,
		fileSize,
		originalBuffer,
		thumbnailBuffer,
	};
};

export type BookInput = {
	image: File;
	isbn: string;
	rating: number;
	tags: string[];
	title: string;
};
