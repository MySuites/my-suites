import MapKit
import MyHealthKit
import SwiftUI

// Ported from apps/myhealth/components/workouts/LiveWorkoutMap.tsx — draws
// the in-progress GPS route for an outdoor exercise (Running/Biking) as it's
// recorded, following the runner like Strava/Nike Run Club's in-run map.
// RN polls WorkoutLocationTrackingService every 3s from a plain MapView;
// here the route points are handed in directly (the caller already polls
// LocationTrackingService.shared.liveRoute() on its own 1s timer to also
// drive the set's auto-filled distance field), and rendered as a
// MapPolyline + a marker at the most recent point.
struct LiveWorkoutMapView: View {
    let points: [LocationTrackingService.TrackedRoutePoint]
    var color: Color = .accentColor

    @State private var cameraPosition: MapCameraPosition = .automatic

    private var coordinates: [CLLocationCoordinate2D] {
        points.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) }
    }

    var body: some View {
        Map(position: $cameraPosition) {
            if coordinates.count >= 2 {
                MapPolyline(coordinates: coordinates)
                    .stroke(color, lineWidth: 4)
            }
            if let last = coordinates.last {
                Marker("", coordinate: last)
                    .tint(color)
            }
        }
        .mapControls { }
        .onChange(of: coordinates.last?.latitude) {
            guard let last = coordinates.last else { return }
            withAnimation {
                cameraPosition = .region(
                    MKCoordinateRegion(center: last, span: MKCoordinateSpan(latitudeDelta: 0.005, longitudeDelta: 0.005))
                )
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
