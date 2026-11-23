import SwiftUI

struct SignInView: View {
    let status: AuthenticationModel.Status
    let onSignIn: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                content
                    .padding(AppLayout.section)
                    .frame(maxWidth: 360)
                    .background(AppColors.background, in: .rect(cornerRadius: 28))
                    .overlay {
                        RoundedRectangle(cornerRadius: 28)
                            .strokeBorder(AppColors.primary.opacity(0.2))
                            .allowsHitTesting(false)
                            .accessibilityHidden(true)
                    }
                    .padding(AppLayout.section)
                    .frame(maxWidth: .infinity)
            }
            .defaultScrollAnchor(.center, for: .alignment)
            .background {
                AppColors.background
                    .overlay {
                        RadialGradient(
                            colors: [AppColors.primary.opacity(0.16), AppColors.background],
                            center: .top,
                            startRadius: 0,
                            endRadius: 520
                        )
                    }
                    .ignoresSafeArea()
            }
            .foregroundStyle(AppColors.foreground)
            .navigationTitle("Memdex")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch status {
        case .signedOut, .working:
            VStack(spacing: AppLayout.section) {
                heading(String(localized: "ログインが必要です"), symbol: "lock.fill")
                signInButton(String(localized: "Auth0でログイン"), isBusy: status == .working)
            }
        case let .error(message):
            VStack(spacing: AppLayout.section) {
                VStack(spacing: AppLayout.small) {
                    heading(String(localized: "認証に失敗しました"), symbol: "exclamationmark.circle")
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(AppColors.mutedForeground)
                }
                signInButton(String(localized: "再試行"), isBusy: false)
            }
            .multilineTextAlignment(.center)
        case .unavailable:
            heading(String(localized: "Auth0が未設定です"), symbol: "exclamationmark.triangle")
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("auth0-unconfigured-message")
        case .authenticated:
            EmptyView()
        }
    }

    private func heading(_ title: String, symbol: String) -> some View {
        VStack(spacing: AppLayout.inset) {
            Image(systemName: symbol)
                .font(.title3.weight(.semibold))
                .padding(AppLayout.inset)
                .foregroundStyle(AppColors.primary)
                .background(AppColors.primary.opacity(0.12), in: .rect(cornerRadius: 16))
                .accessibilityHidden(true)
            Text(title)
                .font(.title2.weight(.semibold))
                .multilineTextAlignment(.center)
                .accessibilityAddTraits(.isHeader)
        }
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
