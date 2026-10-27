import Auth0
import Foundation

@MainActor
final class AuthenticationModel: ObservableObject {
    private static let ownerDefaultsKey = "MobileOwnerKey"
    enum Status: Equatable {
        case authenticated
        case error(String)
        case signedOut
        case unavailable
        case working
    }

    @Published private(set) var status: Status
    @Published private(set) var ownerKey: String
    @Published private(set) var logoutError: String?
    @Published private(set) var isLoggingOut = false

    let configuration: Auth0Configuration
    private let credentialsManager: CredentialsManager?

    init(configuration: Auth0Configuration = Auth0Configuration()) {
        self.configuration = configuration
        ownerKey = UserDefaults.standard.string(forKey: Self.ownerDefaultsKey) ?? "unlinked"

        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-testing-authenticated") {
            credentialsManager = nil
            status = .authenticated
            ownerKey = "ui-testing-user"
            return
        }
        if ProcessInfo.processInfo.arguments.contains("-ui-testing-signed-out") {
            credentialsManager = nil
            status = configuration.isConfigured ? .signedOut : .unavailable
            return
        }
        #endif

        guard configuration.isConfigured else {
            credentialsManager = nil
            status = .unavailable
            return
        }

        credentialsManager = CredentialsManager(
            authentication: Auth0.authentication(
                clientId: configuration.clientID,
                domain: configuration.domain
            )
        )
        status = credentialsManager?.hasValid() == true ? .authenticated : .signedOut
    }

    func logIn() async {
        guard status != .working else { return }
        guard let credentialsManager else {
            status = .unavailable
            return
        }

        status = .working
        do {
            let credentials = try await Auth0
                .webAuth(clientId: configuration.clientID, domain: configuration.domain)
                .audience(configuration.audience)
                .scope("openid profile email offline_access")
                .start()
            try credentialsManager.store(credentials: credentials)
            rememberOwner(from: credentials.idToken)
            status = .authenticated
        } catch {
            if MobileOperationError.isCancellation(error, taskIsCancelled: Task.isCancelled) {
                status = .signedOut
            } else if let webError = error as? WebAuthError, case .userCancelled = webError {
                status = .signedOut
            } else {
                status = .error(MobileOperationError.message(error, taskIsCancelled: Task.isCancelled)
                    ?? String(localized: "認証に失敗しました。再試行してください"))
            }
        }
    }

    func logOut() async {
        guard status == .authenticated && !isLoggingOut else { return }
        guard let credentialsManager else {
            status = .unavailable
            return
        }

        logoutError = nil
        isLoggingOut = true
        defer { isLoggingOut = false }
        do {
            try await Auth0
                .webAuth(clientId: configuration.clientID, domain: configuration.domain)
                .logout()
            try credentialsManager.clear()
            status = .signedOut
        } catch {
            if MobileOperationError.isCancellation(error, taskIsCancelled: Task.isCancelled) { return }
            if let webError = error as? WebAuthError, case .userCancelled = webError { return }
            logoutError = MobileOperationError.message(error, taskIsCancelled: Task.isCancelled)
        }
    }

    func accessToken() async throws -> String {
        guard let credentialsManager else { throw MobileClientError.authenticationRequired }
        do {
            let credentials = try await withCheckedThrowingContinuation { continuation in
                credentialsManager.credentials { result in
                    continuation.resume(with: result)
                }
            }
            rememberOwner(from: credentials.idToken)
            status = .authenticated
            return credentials.accessToken
        } catch {
            if MobileOperationError.isCancellation(error, taskIsCancelled: Task.isCancelled) {
                throw CancellationError()
            }
            status = .signedOut
            throw MobileClientError.authenticationRequired
        }
    }

    func requireLogin() { status = .signedOut }

    private func rememberOwner(from token: String) {
        let parts = token.split(separator: ".")
        guard parts.count > 1 else { return }
        var encoded = String(parts[1]).replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        encoded += String(repeating: "=", count: (4 - encoded.count % 4) % 4)
        guard let data = Data(base64Encoded: encoded),
              let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let subject = payload["sub"] as? String,
              !subject.isEmpty
        else { return }
        ownerKey = subject
        UserDefaults.standard.set(subject, forKey: Self.ownerDefaultsKey)
    }
}
