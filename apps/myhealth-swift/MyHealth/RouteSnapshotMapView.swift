import MapKit
import MyHealthKit
import SwiftUI

// Ported from apps/myhealth/components/workouts/RouteSnapshotMap.tsx — a
// static map fit once to a completed route's bounds. RN rasterizes this via
// MapView.takeSnapshot() into a plain <Image> because its map view can't be
// reused as both a small thumbnail and the full-screen interactive viewer at
// once; SwiftUI's Map has no such restriction, so this same view serves both
// (`interactive` just toggles gesture/control availability), no offscreen
// snapshot step needed.
struct RouteSnapshotMapView: View {
    let coordinates: [CLLocationCoordinate2D]
    var color: Color = .accentColor
    var interactive: Bool = false

    @State private var cameraPosition: MapCameraPosition = .automatic

    init(coordinates: [CLLocationCoordinate2D], color: Color = .accentColor, interactive: Bool = false) {
        self.coordinates = coordinates
        self.color = color
        self.interactive = interactive
    }

    init(routePoints: [RoutePoint], color: Color = .accentColor, interactive: Bool = false) {
        self.init(
            coordinates: routePoints.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) },
            color: color,
            interactive: interactive
        )
    }

    var body: some View {
        Map(position: $cameraPosition, interactionModes: interactive ? .all : []) {
            if coordinates.count >= 2 {
                MapPolyline(coordinates: coordinates)
                    .stroke(color, lineWidth: interactive ? 4 : 3)
            }
        }
        .mapControls { }
        .onAppear {
            if let region = Self.boundingRegion(for: coordinates, padded: interactive) {
                cameraPosition = .region(region)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: interactive ? 0 : 12))
    }

    private static func boundingRegion(for coordinates: [CLLocationCoordinate2D], padded: Bool) -> MKCoordinateRegion? {
        guard !coordinates.isEmpty else { return nil }
        let lats = coordinates.map(\.latitude)
        let lons = coordinates.map(\.longitude)
        let minLat = lats.min()!, maxLat = lats.max()!
        let minLon = lons.min()!, maxLon = lons.max()!
        let center = CLLocationCoordinate2D(latitude: (minLat + maxLat) / 2, longitude: (minLon + maxLon) / 2)
        let padding = padded ? 1.8 : 1.3
        let span = MKCoordinateSpan(
            latitudeDelta: max((maxLat - minLat) * padding, 0.005),
            longitudeDelta: max((maxLon - minLon) * padding, 0.005)
        )
        return MKCoordinateRegion(center: center, span: span)
    }
}
