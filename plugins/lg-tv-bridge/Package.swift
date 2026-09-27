// swift-tools-version: 5.9
import PackageDescription

// Pacote SPM do plugin nativo local LgTvBridge.
// O Capacitor CLI (npx cap sync ios) referencia este pacote a partir de node_modules/lg-tv-bridge.
let package = Package(
    name: "LgTvBridge",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "LgTvBridge",
            targets: ["LgTvBridgePlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "LgTvBridgePlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/LgTvBridgePlugin")
    ]
)
