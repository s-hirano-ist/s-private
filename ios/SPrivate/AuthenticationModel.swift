import Auth0
import Foundation

@MainActor
final class AuthenticationModel: ObservableObject {
    enum Status: Equatable {
        case authenticated
        case error(String)
        case signedOut
        case unavailable
        case working
    }

    @Published private(set) var status: Status

    let configuration: Auth0Configuration
    private let credentialsManager: CredentialsManager?

    init(configuration: Auth0Configuration = Auth0Configuration()) {
        self.configuration = configuration

        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-testing-authenticated") {
            credentialsManager = nil
            status = .authenticated
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
            status = .authenticated
        } catch {
            status = .error(error.localizedDescription)
        }
    }

    func logOut() async {
        guard let credentialsManager else {
            status = .unavailable
            return
        }

        status = .working
        do {
            try await Auth0
                .webAuth(clientId: configuration.clientID, domain: configuration.domain)
                .logout()
            try credentialsManager.clear()
            status = .signedOut
        } catch {
            status = .error(error.localizedDescription)
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
            status = .authenticated
            return credentials.accessToken
        } catch {
            status = .signedOut
            throw MobileClientError.authenticationRequired
        }
    }

    func requireLogin() { status = .signedOut }
}
