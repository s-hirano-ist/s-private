import Foundation
import ImageIO
import SwiftUI
import UIKit

// Feed thumbnails are memory-only. Neither response bodies nor original-sized images enter the disk cache.
actor RssThumbnailLoader {
    static let shared = RssThumbnailLoader()
    private let session: URLSession
    private let images: NSCache<NSString, UIImage> = {
        let cache = NSCache<NSString, UIImage>()
        cache.totalCostLimit = 20 * 1_048_576
        return cache
    }()
    private var active = 0
    private var waiters: [(UUID, CheckedContinuation<Bool, Never>)] = []
    private var tasks: [UUID: Task<UIImage?, Never>] = [:]
    private var generation = 0

    init() {
        let config = URLSessionConfiguration.ephemeral
        config.urlCache = nil
        config.httpCookieStorage = nil
        config.httpShouldSetCookies = false
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        session = URLSession(configuration: config)
    }

    func clear() {
        generation += 1
        images.removeAllObjects()
        for task in tasks.values { task.cancel() }
        for (_, continuation) in waiters { continuation.resume(returning: false) }
        waiters.removeAll()
    }

    func image(url: URL, pixelSize: Int) async -> UIImage? {
        let key = "\(url.absoluteString):\(pixelSize)" as NSString
        if let cached = images.object(forKey: key) { return cached }
        let id = UUID()
        let current = generation
        let acquired = await withTaskCancellationHandler {
            await acquire(id)
        } onCancel: { Task { await self.cancelWaiter(id) } }
        guard acquired else { return nil }
        defer { release(); tasks.removeValue(forKey: id) }
        guard !Task.isCancelled, current == generation else { return nil }
        if let cached = images.object(forKey: key) { return cached }
        let session = session
        let task = Task.detached(priority: .utility) {
            try? await Self.fetch(session: session, url: url, pixelSize: pixelSize)
        }
        tasks[id] = task
        let result = await withTaskCancellationHandler { await task.value } onCancel: { task.cancel() }
        guard !Task.isCancelled, current == generation else { return nil }
        if let result, let cgImage = result.cgImage {
            images.setObject(result, forKey: key, cost: cgImage.bytesPerRow * cgImage.height)
        }
        return result
    }

    private func acquire(_ id: UUID) async -> Bool {
        guard !Task.isCancelled else { return false }
        if active < 4 { active += 1; return true }
        return await withCheckedContinuation { waiters.append((id, $0)) }
    }
    private func cancelWaiter(_ id: UUID) {
        if let index = waiters.firstIndex(where: { $0.0 == id }) { waiters.remove(at: index).1.resume(returning: false) }
    }
    private func release() {
        if waiters.isEmpty { active -= 1 }
        else { waiters.removeFirst().1.resume(returning: true) }
    }
    private nonisolated static func fetch(session: URLSession, url: URL, pixelSize: Int) async throws -> UIImage? {
        let limit = 5 * 1_048_576
        let (bytes, response) = try await session.bytes(from: url)
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode),
            response.url?.scheme?.lowercased() == "https", response.expectedContentLength <= limit else { return nil }
        var data = Data()
        for try await byte in bytes {
            if data.count >= limit { throw URLError(.dataLengthExceedsMaximum) }
            if data.count.isMultiple(of: 65_536) { try Task.checkCancellation() }
            data.append(byte)
        }
        try Task.checkCancellation()
        return decode(data, pixelSize: pixelSize)
    }
    nonisolated static func decode(_ data: Data, pixelSize: Int) -> UIImage? {
        guard let source = CGImageSourceCreateWithData(data as CFData, [kCGImageSourceShouldCache: false] as CFDictionary),
            let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceShouldCacheImmediately: true,
                kCGImageSourceThumbnailMaxPixelSize: pixelSize,
            ] as CFDictionary) else { return nil }
        return UIImage(cgImage: image)
    }
}

struct RssThumbnailView: View {
    let url: URL
    @Environment(\.displayScale) private var scale
    @State private var image: UIImage?
    @State private var finished = false
    #if DEBUG
    @Environment(\.feedThumbnailFixture) private var fixture
    #endif

    var body: some View {
        Group {
            if let image { Image(uiImage: image).resizable().scaledToFill() }
            else if finished { ImagePlaceholder() }
            else { LoadingContent { SkeletonBlock() } }
        }
        .frame(width: 72, height: 72).clipped().accessibilityHidden(true)
        .task(id: url) {
            image = nil
            finished = false
            #if DEBUG
            if let fixture {
                image = fixture(url)
                finished = true
                return
            }
            #endif
            let value = await RssThumbnailLoader.shared.image(url: url, pixelSize: Int(72 * scale))
            guard !Task.isCancelled else { return }
            image = value
            finished = true
        }
    }
}

#if DEBUG
extension EnvironmentValues {
    @Entry var feedThumbnailFixture: ((URL) -> UIImage?)? = nil
}
#endif

#Preview("RSS — Thumbnail loading") {
    RssThumbnailView(url: URL(string: "https://example.com/thumbnail.jpg")!)
}
