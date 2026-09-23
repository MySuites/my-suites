#if os(iOS)
import CoreLocation
import Foundation

// GPS route tracking is an iPhone-only feature (outdoor exercises tracked
// via phone GPS) — see SWIFT_MIGRATION_PLAN.md; not built for watchOS.
//
// Ported from apps/myhealth/services/WorkoutLocationTrackingService.ts.
// CoreLocation replaces expo-location/expo-task-manager directly. The RN
// version buffered points to AsyncStorage so a headless-relaunched app could
// resume; this keeps the buffer in-memory on the CLLocationManagerDelegate
// instead — CLLocationManager itself (with allowsBackgroundLocationUpdates)
// is what survives backgrounding, not this buffer, so in-memory is
// sufficient as long as the process itself isn't killed. Revisit if that
// turns out to be a real gap once outdoor tracking is exercised end-to-end.
@MainActor
public final class LocationTrackingService: NSObject, CLLocationManagerDelegate {
    public static let shared = LocationTrackingService()

    private let manager = CLLocationManager()
    private var buffer: [TrackedRoutePoint] = []

    private override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        manager.distanceFilter = 10
        manager.allowsBackgroundLocationUpdates = false // flipped on in startTracking() once authorized
        manager.pausesLocationUpdatesAutomatically = false
    }

    public struct TrackedRoutePoint {
        public var latitude: Double
        public var longitude: Double
        public var altitude: Double?
        public var timestamp: Date
    }

    // Requests when-in-use, then always — mirrors the RN version's
    // foreground-then-background request order. Returns true if at least
    // when-in-use was granted; background denial just means updates pause
    // while backgrounded, not a hard failure.
    public func requestPermissions() async -> Bool {
        let status = manager.authorizationStatus
        if status == .notDetermined {
            manager.requestWhenInUseAuthorization()
            // CLLocationManager's authorization callback is delegate-based,
            // not async — poll briefly rather than blocking indefinitely.
            for _ in 0..<20 where manager.authorizationStatus == .notDetermined {
                try? await Task.sleep(nanoseconds: 100_000_000)
            }
        }
        guard manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways else {
            return false
        }
        if manager.authorizationStatus == .authorizedWhenInUse {
            manager.requestAlwaysAuthorization()
        }
        return true
    }

    public func startTracking() {
        buffer.removeAll()
        manager.allowsBackgroundLocationUpdates = manager.authorizationStatus == .authorizedAlways
        manager.startUpdatingLocation()
    }

    // Safe to poll while tracking is still in progress — unlike
    // stopTracking(), it doesn't clear the buffer.
    public func liveRoute() -> [TrackedRoutePoint] {
        buffer
    }

    @discardableResult
    public func stopTracking() -> [TrackedRoutePoint] {
        manager.stopUpdatingLocation()
        let points = buffer
        buffer.removeAll()
        return points
    }

    public nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let points = locations.map {
            TrackedRoutePoint(
                latitude: $0.coordinate.latitude,
                longitude: $0.coordinate.longitude,
                altitude: $0.altitude,
                timestamp: $0.timestamp
            )
        }
        Task { @MainActor in
            self.buffer.append(contentsOf: points)
        }
    }
}
#endif
