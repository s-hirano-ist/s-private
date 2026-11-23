import SwiftUI

struct SignInView: View {
    let status: AuthenticationModel.Status
    let onSignIn: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AppLayout.section) {
                    AppScreenHeading("Memdex")
                    content
                }
                .frame(maxWidth: 360, alignment: .leading)
                .padding(AppLayout.section)
                .frame(maxWidth: .infinity)
            }
            .defaultScrollAnchor(.center, for: .alignment)
            .background(AppColors.background.ignoresSafeArea())
            .foregroundStyle(AppColors.foreground)
            .toolbarVisibility(.hidden, for: .navigationBar)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch status {
        case .signedOut, .working:
            VStack(alignment: .leading, spacing: AppLayout.section) {
                statusLabel(String(localized: "ログインが必要です"), symbol: "lock.fill")
                signInButton(String(localized: "Auth0でログイン"), isBusy: status == .working)
            }
        case let .error(message):
            VStack(alignment: .leading, spacing: AppLayout.section) {
                VStack(alignment: .leading, spacing: AppLayout.small) {
                    statusLabel(String(localized: "認証に失敗しました"), symbol: "exclamationmark.circle")
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(AppColors.mutedForeground)
                }
                signInButton(String(localized: "再試行"), isBusy: false)
            }
        case .unavailable:
            statusLabel(String(localized: "Auth0が未設定です"), symbol: "exclamationmark.triangle")
                .accessibilityIdentifier("auth0-unconfigured-message")
        case .authenticated:
            EmptyView()
        }
    }

    private func statusLabel(_ title: String, symbol: String) -> some View {
        Label {
            Text(title).foregroundStyle(AppColors.foreground)
        } icon: {
            Image(systemName: symbol).foregroundStyle(AppColors.primary)
                .accessibilityHidden(true)
        }
        .font(.subheadline.weight(.semibold))
    }

    private func signInButton(_ title: String, isBusy: Bool) -> some View {
        Button(action: onSignIn) {
            BusyLabel(isBusy: isBusy) {
                Text(title)
                    .font(.body.weight(.semibold))
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity, minHeight: 52)
        }
        .buttonStyle(.borderedProminent)
        .buttonBorderShape(.roundedRectangle(radius: 14))
        .tint(AppColors.primary)
        .foregroundStyle(AppColors.primaryForeground)
        .accessibilityValue(isBusy ? String(localized: "処理中") : "")
        .disabled(isBusy)
        .accessibilityIdentifier("auth0-login-button")
    }
}

#Preview("Signed out") {
    SignInView(status: .signedOut) {}
}

#Preview("Signing in") {
    SignInView(status: .working) {}
}

#Preview("Sign-in error") {
    SignInView(status: .error(String(localized: "認証に失敗しました。再試行してください"))) {}
}

#Preview("Unavailable") {
    SignInView(status: .unavailable) {}
}
