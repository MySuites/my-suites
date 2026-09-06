// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "MyHealthKit",
    platforms: [
        .iOS(.v17),
        .watchOS(.v10),
    ],
    products: [
        .library(name: "MyHealthKit", targets: ["MyHealthKit"]),
    ],
    targets: [
        .target(
            name: "MyHealthKit",
            resources: [.process("Resources")],
            linkerSettings: [.linkedLibrary("sqlite3")]
        ),
        .testTarget(
            name: "MyHealthKitTests",
            dependencies: ["MyHealthKit"],
            linkerSettings: [.linkedLibrary("sqlite3")]
        ),
    ]
)
