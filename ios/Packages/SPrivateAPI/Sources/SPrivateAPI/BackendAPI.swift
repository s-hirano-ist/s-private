import Foundation
import HTTPTypes
import OpenAPIRuntime
import OpenAPIURLSession

/// A public HTTP failure, without exposing the generated client's request/token in its description.
public struct BackendHTTPError: Error, Sendable {
    public let status: Int
    public let code: Components.Schemas.ApiError.errorPayload.codePayload?

    public static func from(_ error: any Error) -> Self? {
        if let error = error as? Self { return error }
        if let error = error as? ClientError { return from(error.underlyingError) }
        return nil
    }
}

public enum BackendAPI {
    /// The caller supplies request-scoped authentication through client middleware.
    public static func client(serverURL: URL, middlewares: [any ClientMiddleware]) -> Client {
        Client(serverURL: serverURL, transport: transport(), middlewares: middlewares)
    }

    /// The native app obtains a fresh access token before each operation. No retries are added here.
    public static func authenticatedClient(
        serverURL: URL, accessToken: String, transport: (any ClientTransport)? = nil
    ) -> Client {
        Client(serverURL: serverURL, transport: transport ?? self.transport(), middlewares: [
            BearerMiddleware(accessToken: accessToken)
        ])
    }

    private static func transport() -> URLSessionTransport {
        URLSessionTransport(configuration: .init(session: session))
    }

    // Native API calls must not inherit Web cookies, cached owner data, or follow redirects.
    private static let session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        configuration.httpCookieStorage = nil
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: configuration, delegate: RejectRedirects(), delegateQueue: nil)
    }()
}

private struct BearerMiddleware: ClientMiddleware {
    let accessToken: String
    func intercept(
        _ request: HTTPRequest, body: HTTPBody?, baseURL: URL, operationID: String,
        next: @Sendable (HTTPRequest, HTTPBody?, URL) async throws -> (HTTPResponse, HTTPBody?)
    ) async throws -> (HTTPResponse, HTTPBody?) {
        var request = request
        request.headerFields[.authorization] = "Bearer \(accessToken)"
        request.headerFields[.cookie] = nil
        request.headerFields[.cacheControl] = "no-store"
        let (response, body) = try await next(request, body, baseURL)
        guard (200..<300).contains(response.status.code) else {
            // Error bodies are bounded and decoded with the generated contract too.
            var envelope: Components.Schemas.ApiError?
            if let body, let data = try? await Data(collecting: body, upTo: 16_384) {
                envelope = try? JSONDecoder().decode(Components.Schemas.ApiError.self, from: data)
            }
            try Task.checkCancellation()
            throw BackendHTTPError(status: response.status.code, code: envelope?.error.code)
        }
        return (response, body)
    }
}

private final class RejectRedirects: NSObject, URLSessionTaskDelegate {
    func urlSession(
        _ session: URLSession, task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
        completionHandler: @escaping @Sendable (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }
}
