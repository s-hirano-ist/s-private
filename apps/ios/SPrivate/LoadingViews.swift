import SwiftUI

/// The normal label owns layout in every phase, including inherited toolbar label styles.
/// Controls must expose their own busy state; toolbar buttons need it in their label,
/// because their accessibility value is not exposed by the native bar button.
struct BusyLabel<LabelContent: View>: View {
    let isBusy: Bool
    var status = String(localized: "処理中")
    @ViewBuilder var label: LabelContent

    var body: some View {
        label
            .opacity(isBusy ? 0 : 1)
            .frame(minWidth: 20, minHeight: 20)
            .overlay {
                if isBusy {
                    ProgressView().controlSize(.small).accessibilityHidden(true)
                }
            }
            .accessibilityRepresentation {
                label
                    .accessibilityElement(children: .combine)
                    .accessibilityValue(isBusy ? status : "")
            }
    }
}

/// Static placeholders share the app's semantic colors in both appearances.
struct SkeletonBlock: View {
    var cornerRadius: CGFloat = 6

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(AppColors.muted)
            .accessibilityHidden(true)
    }
}

struct SkeletonText: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            SkeletonBlock().frame(height: 16)
            SkeletonBlock().frame(maxWidth: .infinity, alignment: .leading)
                .frame(height: 12).padding(.trailing, 64)
        }
        .padding(.vertical, 8)
    }
}

struct LoadingContent<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        content
            .allowsHitTesting(false)
            .accessibilityElement(children: .ignore)
            .accessibilityHidden(false)
            .accessibilityLabel(String(localized: "読み込み中"))
    }
}

/// The outer frame owns geometry; none of the asynchronous phases can resize it.
struct MediaFrame<Content: View>: View {
    var aspectRatio: CGFloat = 4.0 / 3.0
    @ViewBuilder var content: Content

    var body: some View {
        Color.clear
            .aspectRatio(aspectRatio, contentMode: .fit)
            .overlay { content.frame(maxWidth: .infinity, maxHeight: .infinity) }
            .clipped()
            .accessibilityElement(children: .contain)
    }
}

struct DetailSkeleton: View {
    let domain: MobileDomain

    var body: some View {
        LoadingContent {
            VStack(alignment: .leading, spacing: 16) {
                if domain != .images {
                    SkeletonBlock().frame(height: 28).padding(.trailing, 40)
                    SkeletonBlock().frame(width: 64, height: 17)
                }
                if domain == .books || domain == .images {
                    MediaFrame(aspectRatio: domain == .books ? 1 : 4.0 / 3.0) {
                        SkeletonBlock()
                    }
                }
                if domain != .images {
                    SkeletonText()
                    SkeletonText()
                }
            }
        }
    }
}

/// A URL's presence determines whether space is reserved, rather than its load phase.
struct RemoteImageView: View {
    let url: URL
    let label: String
    var thumbnail = false

    var body: some View {
        Group {
            if thumbnail {
                phases.frame(width: 72, height: 72).clipped().accessibilityHidden(true)
            } else {
                MediaFrame { phases }
            }
        }
    }

    private var phases: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case let .success(image):
                if thumbnail {
                    image.resizable().scaledToFill()
                } else {
                    image.resizable().scaledToFit().accessibilityLabel(label)
                }
            case .empty:
                LoadingContent { SkeletonBlock() }
            case .failure:
                ImagePlaceholder(label: label)
            @unknown default:
                ImagePlaceholder(label: label)
            }
        }
    }
}

struct ImagePlaceholder: View {
    var label = String(localized: "画像")

    var body: some View {
        Image(systemName: "photo")
            .font(.title2)
            .foregroundStyle(AppColors.mutedForeground)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(AppColors.muted)
            .accessibilityLabel(label)
    }
}

#Preview("Loading — List") {
    LoadingContent {
        VStack(spacing: 16) { ForEach(0..<6) { _ in SkeletonText() } }
    }.padding().background(AppColors.background)
}

#Preview("Loading — Book") {
    ScrollView { DetailSkeleton(domain: .books).padding() }.background(AppColors.background)
}

#Preview("Loading — Image") {
    DetailSkeleton(domain: .images).background(AppColors.background)
}

#Preview("Actions — Idle and working") {
    VStack(alignment: .leading, spacing: 24) {
        ForEach([false, true], id: \.self) { busy in
            HStack(spacing: 24) {
                Button {} label: {
                    BusyLabel(isBusy: busy) { Label(String(localized: "削除"), systemImage: "trash") }
                }.labelStyle(.iconOnly).disabled(busy)
                Button {} label: {
                    BusyLabel(isBusy: busy) { Text(String(localized: "保存")) }
                }.disabled(busy)
                Button {} label: {
                    BusyLabel(isBusy: busy) { Text(String(localized: "今すぐ同期")) }
                }.disabled(busy)
            }
        }
    }.padding()
}
