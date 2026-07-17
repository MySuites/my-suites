export interface GeoPoint {
    latitude: number;
    longitude: number;
    altitude?: number;
}

const EARTH_RADIUS_METERS = 6371000;

// Haversine distance between two points, in meters.
function distanceBetween(a: GeoPoint, b: GeoPoint): number {
    const lat1 = (a.latitude * Math.PI) / 180;
    const lat2 = (b.latitude * Math.PI) / 180;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;

    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

// Total distance covered by a route, in meters (sum of consecutive point deltas).
export function computeRouteDistance(points: GeoPoint[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += distanceBetween(points[i - 1], points[i]);
    }
    return total;
}

// Total elevation gain, in meters (sum of positive altitude deltas only).
// Returns undefined if no point has altitude data.
export function computeElevationGain(points: GeoPoint[]): number | undefined {
    const hasAltitude = points.some(p => p.altitude != null);
    if (!hasAltitude) return undefined;

    let gain = 0;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1].altitude;
        const curr = points[i].altitude;
        if (prev != null && curr != null && curr > prev) {
            gain += curr - prev;
        }
    }
    return gain;
}
