import { formatStopwatch } from "../utils/formatting";

describe("formatStopwatch", () => {
    it("formats sub-hour durations as MM:SS", () => {
        expect(formatStopwatch(0)).toBe("00:00");
        expect(formatStopwatch(5)).toBe("00:05");
        expect(formatStopwatch(65)).toBe("01:05");
        expect(formatStopwatch(3599)).toBe("59:59");
    });

    it("formats hour-plus durations as H:MM:SS", () => {
        expect(formatStopwatch(3600)).toBe("1:00:00");
        expect(formatStopwatch(3665)).toBe("1:01:05");
        expect(formatStopwatch(7325)).toBe("2:02:05");
    });

    it("clamps negative/fractional input", () => {
        expect(formatStopwatch(-5)).toBe("00:00");
        expect(formatStopwatch(65.9)).toBe("01:05");
    });
});
