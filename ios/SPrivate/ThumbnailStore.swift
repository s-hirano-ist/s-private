import CryptoKit
import Foundation
import ImageIO
import UIKit

actor ThumbnailStore {
    static let shared = ThumbnailStore()

    private let images: NSCache<NSString, UIImage> = {
        let cache = NSCache<NSString, UIImage>()
        cache.totalCostLimit = 32 * 1_048_576
        return cache
    }()

    func clear() { images.removeAllObjects() }

    func clearDisk() {
        images.removeAllObjects()
        if let directory = try? thumbnailDirectory() { try? FileManager.default.removeItem(at: directory) }
    }

    func contains(owner: String, domain: MobileDomain, id: String) -> Bool {
        (try? fileURL(for: cacheKey(owner: owner, domain: domain, id: id)))
            .map { FileManager.default.fileExists(atPath: $0.path) } ?? false
    }

    func remove(owner: String, domain: MobileDomain, id: String) {
        let key = cacheKey(owner: owner, domain: domain, id: id)
        if let url = try? fileURL(for: key) { try? FileManager.default.removeItem(at: url) }
        images.removeAllObjects()
    }

    func image(owner: String, domain: MobileDomain, id: String, pixelSize: Int) -> UIImage? {
        let key = cacheKey(owner: owner, domain: domain, id: id)
        if let image = images.object(forKey: "\(key)-\(pixelSize)" as NSString) { return image }
        guard let data = try? Data(contentsOf: fileURL(for: key)) else { return nil }
        return decoded(data, key: key, pixelSize: pixelSize)
    }

    func saveAndDecode(_ data: Data, owner: String, domain: MobileDomain, id: String, pixelSize: Int) -> UIImage? {
        let key = cacheKey(owner: owner, domain: domain, id: id)
        if let url = try? fileURL(for: key) { try? data.write(to: url, options: .atomic) }
        return decoded(data, key: key, pixelSize: pixelSize)
    }

    private func decoded(_ data: Data, key: String, pixelSize: Int) -> UIImage? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: pixelSize
              ] as CFDictionary) else { return nil }
        let result = UIImage(cgImage: image)
        images.setObject(result, forKey: "\(key)-\(pixelSize)" as NSString, cost: image.bytesPerRow * image.height)
        return result
    }

    private func cacheKey(owner: String, domain: MobileDomain, id: String) -> String {
        let input = Data("\(owner):\(domain.rawValue):\(id)".utf8)
        return SHA256.hash(data: input).map { String(format: "%02x", $0) }.joined()
    }

    private func fileURL(for key: String) throws -> URL {
        try thumbnailDirectory().appending(path: key)
    }

    private func thumbnailDirectory() throws -> URL {
        let root = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appending(path: "MobileMedia/Thumbnails", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root
    }
}
