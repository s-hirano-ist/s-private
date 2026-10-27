import SwiftUI

/// Content colors mirror the semantic light and dark tokens in packages/ui/src/styles.css.
/// System controls keep their native materials and use primary only as their tint.
enum AppColors {
    static let background = Color("AppBackground")
    static let foreground = Color("AppForeground")
    static let muted = Color("AppMuted")
    static let mutedForeground = Color("AppMutedForeground")
    static let primary = Color("AppPrimary")
    static let destructive = Color("AppDestructive")
    static let success = Color("AppSuccess")
}
