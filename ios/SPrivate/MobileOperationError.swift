import Foundation

enum MobileOperationError {
    static func isCancellation(_ error: Error, taskIsCancelled: Bool = false) -> Bool {
        if taskIsCancelled || error is CancellationError { return true }
        let nsError = error as NSError
        return (nsError.domain == NSURLErrorDomain && nsError.code == URLError.cancelled.rawValue)
            || (nsError.domain == NSCocoaErrorDomain && nsError.code == NSUserCancelledError)
    }

    static func message(_ error: Error, taskIsCancelled: Bool = false) -> String? {
        if isCancellation(error, taskIsCancelled: taskIsCancelled) { return nil }
        if let clientError = error as? MobileClientError {
            switch clientError {
            case .http(401, _), .authenticationRequired:
                return String(localized: "ログインしてから再試行してください")
            case .http:
                return String(localized: "サーバーに接続できませんでした。再試行してください")
            default:
                return clientError.localizedDescription
            }
        }
        if let urlError = error as? URLError,
           [.notConnectedToInternet, .networkConnectionLost, .timedOut, .cannotConnectToHost, .cannotFindHost].contains(urlError.code) {
            return String(localized: "通信環境を確認して再試行してください")
        }
        return String(localized: "操作を完了できませんでした。再試行してください")
    }
}
