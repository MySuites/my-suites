import { computeRouteDistance, computeElevationGain } from "../utils/geo";

describe("geo", () => {
    describe("computeRouteDistance", () => {
        it("returns 0 for fewer than 2 points", () => {
            expect(computeRouteDistance([])).toBe(0);
            expect(computeRouteDistance([{ latitude: 0, longitude: 0 }])).toBe(0);
        });

        it("computes a known distance between two coordinates", () => {
            // San Francisco (37.7749, -122.4194) to Oakland (37.8044, -122.2712)
            // ~13.1 km apart.
            const distance = computeRouteDistance([
                { latitude: 37.7749, longitude: -122.4194 },
                { latitude: 37.8044, longitude: -122.2712 },
            ]);
            expect(distance).toBeGreaterThan(12000);
            expect(distance).toBeLessThan(14000);
        });

        it("sums distances across multiple legs", () => {
            const a = { latitude: 0, longitude: 0 };
            const b = { latitude: 0, longitude: 0.01 };
            const c = { latitude: 0.01, longitude: 0.01 };
            const total = computeRouteDistance([a, b, c]);
            const leg1 = computeRouteDistance([a, b]);
            const leg2 = computeRouteDistance([b, c]);
            expect(total).toBeCloseTo(leg1 + leg2, 5);
        });
    });

    describe("computeElevationGain", () => {
        it("returns undefined when no point has altitude data", () => {
            expect(computeElevationGain([{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }])).toBeUndefined();
        });

        it("sums only positive altitude deltas", () => {
            const points = [
                { latitude: 0, longitude: 0, altitude: 100 },
                { latitude: 0, longitude: 0, altitude: 110 }, // +10
                { latitude: 0, longitude: 0, altitude: 105 }, // -5, ignored
                { latitude: 0, longitude: 0, altitude: 120 }, // +15
            ];
            expect(computeElevationGain(points)).toBe(25);
        });
    });
});
