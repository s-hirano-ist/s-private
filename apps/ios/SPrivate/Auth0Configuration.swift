import Foundation

struct Auth0Configuration: Equatable, Sendable {
    let clientID: String
    let domain: String
    let audience: String
    let bundleIdentifier: String

    init(bundle: Bundle = .main) {
        self.init(
            clientID: bundle.object(forInfoDictionaryKey: "Auth0ClientId") as? String ?? "",
            domain: bundle.object(forInfoDictionaryKey: "Auth0Domain") as? String ?? "",
            audience: bundle.object(forInfoDictionaryKey: "Auth0Audience") as? String ?? "",
            bundleIdentifier: bundle.bundleIdentifier ?? "ist.s-hirano.s-private"
        )
    }

    init(clientID: String, domain: String, audience: String, bundleIdentifier: String) {
        self.clientID = clientID.trimmingCharacters(in: .whitespacesAndNewlines)
        self.domain = domain
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "https://", with: "")
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        self.audience = audience.trimmingCharacters(in: .whitespacesAndNewlines)
        self.bundleIdentifier = bundleIdentifier
    }

    var isConfigured: Bool {
        !clientID.isEmpty && !domain.isEmpty && !audience.isEmpty
    }

    var callbackURL: URL? {
        guard isConfigured else { return nil }
        return URL(string: "\(bundleIdentifier)://\(domain)/ios/\(bundleIdentifier)/callback")
    }

    func acceptsCallbackURL(_ url: URL) -> Bool {
        url.scheme == bundleIdentifier
            && url.host == domain
            && url.path == "/ios/\(bundleIdentifier)/callback"
    }
}
