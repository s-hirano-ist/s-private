import { render, screen } from "@testing-library/react";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import { describe, expect, it, vi } from "vitest";
import { ImageStack } from "./image-stack";

const mockDestroy = vi.fn();
const mockInit = vi.fn();

// PhotoSwipeLightboxのモック
vi.mock("photoswipe/lightbox", () => {
	return {
		__esModule: true,
		default: vi.fn().mockImplementation(() => ({
			init: mockInit,
			destroy: mockDestroy,
		})),
	};
});

describe("ImageStack", () => {
	it("renders StatusCodeView if images is an empty array", () => {
		render(<ImageStack images={[]} />);
		expect(screen.getByText("204")).toBeInTheDocument();
	});

	it("renders images when images array is provided", () => {
		const images = [
			{ src: "/image1.jpg", width: 800, height: 600 },
			{ src: "/image2.jpg", width: 1024, height: 768 },
		];

		render(<ImageStack images={images} />);

		// 各画像リンクが表示されているかを確認
		for (const image of images) {
			const linkElement = screen.getByRole("link", {
				name: `Image ${image.src}`,
			});
			expect(linkElement).toHaveAttribute("href", image.src);
			expect(linkElement).toHaveAttribute(
				"data-pswp-width",
				image.width.toString(),
			);
			expect(linkElement).toHaveAttribute(
				"data-pswp-height",
				image.height.toString(),
			);
		}

		// Imageコンポーネントの画像がレンダリングされているか確認
		const imageElements = screen.getAllByAltText("");
		expect(imageElements).toHaveLength(images.length);
		images.forEach((image, index) => {
			expect.stringContaining(encodeURIComponent(image.src));
		});
	});

	it("initializes PhotoSwipeLightbox on mount", () => {
		const images = [{ src: "/image1.jpg", width: 800, height: 600 }];

		render(<ImageStack images={images} />);

		// PhotoSwipeLightboxが初期化されているか確認
		expect(PhotoSwipeLightbox).toHaveBeenCalledTimes(1);
		expect(PhotoSwipeLightbox).toHaveBeenCalledWith({
			gallery: "#image-preview",
			children: "a",
			pswpModule: expect.any(Function),
			bgOpacity: 1.0,
		});
	});

	it("destroys PhotoSwipeLightbox on unmount", () => {
		const images = [{ src: "/image1.jpg", width: 800, height: 600 }];
		const { unmount } = render(<ImageStack images={images} />);

		unmount();

		expect(mockDestroy).toHaveBeenCalledTimes(1);
	});
});
