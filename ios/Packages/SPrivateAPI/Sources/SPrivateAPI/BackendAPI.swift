import Foundation
import OpenAPIRuntime
import OpenAPIURLSession

/// The caller supplies request-scoped authentication through client middleware.
public enum BackendAPI {
    public static func client(serverURL: URL, middlewares: [any ClientMiddleware]) -> Client {
        Client(serverURL: serverURL, transport: URLSessionTransport(), middlewares: middlewares)
    }
}
