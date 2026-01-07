import { renderHook, waitFor } from "@testing-library/react-native";
import { useLatestBodyWeight } from "../../hooks/workouts/useLatestBodyWeight";
import { DataRepository } from "../../providers/DataRepository";

jest.mock("@mysuite/auth", () => ({
    useAuth: jest.fn(() => ({ user: { id: "u1" } })),
}));

// Mock DataRepository
jest.mock("../../providers/DataRepository", () => ({
    DataRepository: {
        getLatestBodyWeight: jest.fn(),
    },
}));

describe("useLatestBodyWeight", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("fetches weight on mount", async () => {
        (DataRepository.getLatestBodyWeight as jest.Mock).mockResolvedValue(
            75.5,
        );

        const { result } = renderHook(() => useLatestBodyWeight());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.weight).toBe(75.5);
        expect(DataRepository.getLatestBodyWeight).toHaveBeenCalledWith("u1");
    });

    it("handles error gracefully", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        (DataRepository.getLatestBodyWeight as jest.Mock).mockRejectedValue(
            new Error("Fetch error"),
        );

        const { result } = renderHook(() => useLatestBodyWeight());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.weight).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
            "Error fetching latest body weight:",
            expect.any(Error),
        );
        consoleSpy.mockRestore();
    });

    it("handles no data found", async () => {
        (DataRepository.getLatestBodyWeight as jest.Mock).mockResolvedValue(
            null,
        );

        const { result } = renderHook(() => useLatestBodyWeight());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.weight).toBeNull();
    });

    it("fetches even if no user (guest support)", async () => {
        const { useAuth } = require("@mysuite/auth");
        useAuth.mockReturnValue({ user: null });
        (DataRepository.getLatestBodyWeight as jest.Mock).mockResolvedValue(80);

        const { result } = renderHook(() => useLatestBodyWeight());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(DataRepository.getLatestBodyWeight).toHaveBeenCalledWith(null);
        expect(result.current.weight).toBe(80);
    });
});
