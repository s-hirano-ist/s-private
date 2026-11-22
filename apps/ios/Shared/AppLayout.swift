import SwiftUI

/// Shared by the app and share extension. Native controls retain their own sizing.
enum AppLayout {
    static let tiny: CGFloat = 4
    static let small: CGFloat = 8
    static let medium: CGFloat = 12
    static let inset: CGFloat = 16
    static let section: CGFloat = 24
    static let minimumTarget: CGFloat = 44
}

extension View {
    func appTapTarget() -> some View {
        frame(minWidth: AppLayout.minimumTarget, minHeight: AppLayout.minimumTarget)
            .contentShape(Rectangle())
    }
}
