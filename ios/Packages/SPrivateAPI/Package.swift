// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SPrivateAPI",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "SPrivateAPI", targets: ["SPrivateAPI"])],
    dependencies: [
        .package(url: "https://github.com/apple/swift-openapi-generator.git", exact: "1.9.0"),
        .package(url: "https://github.com/apple/swift-openapi-runtime.git", exact: "1.11.0"),
        .package(url: "https://github.com/apple/swift-openapi-urlsession.git", exact: "1.3.2"),
    ],
    targets: [
        .target(
            name: "SPrivateAPI",
            dependencies: [
                .product(name: "OpenAPIRuntime", package: "swift-openapi-runtime"),
                .product(name: "OpenAPIURLSession", package: "swift-openapi-urlsession"),
            ],
            exclude: ["openapi-generator-config.yaml"]
        ),
        .testTarget(name: "SPrivateAPITests", dependencies: ["SPrivateAPI"]),
    ]
)
