"use client";
import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK_SRC = "/not-found.png";

type Props = Omit<ImageProps, "src" | "onError"> & {
	src: string | null | undefined;
};

export function ImageWithFallback({ src, alt, ...rest }: Props) {
	const [current, setCurrent] = useState<string>(src || FALLBACK_SRC);
	return (
		<NextImage
			{...rest}
			alt={alt}
			onError={() => setCurrent(FALLBACK_SRC)}
			src={current}
		/>
	);
}
