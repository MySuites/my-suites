import { ProgressPictureService } from "../services/ProgressPictureService";
import { DataRepository } from "../providers/DataRepository";
import * as FileSystem from "expo-file-system";

jest.mock("expo-file-system/legacy", () => require("expo-file-system"));

jest.mock("../providers/DataRepository", () => ({
    DataRepository: {
        getProgressPictures: jest.fn(),
        saveProgressPicture: jest.fn(),
        deleteProgressPicture: jest.fn(),
    },
}));

describe("ProgressPictureService", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getProgressPictures", () => {
        it("should fetch progress pictures from DataRepository", async () => {
            const mockPics = [
                {
                    id: "pic1",
                    userId: "user1",
                    imageUri: "file:///mock-path/pic1.jpg",
                    date: "2026-06-28",
                    notes: "Mock note",
                },
            ];
            (DataRepository.getProgressPictures as jest.Mock).mockResolvedValue(mockPics);

            const result = await ProgressPictureService.getProgressPictures("user1");
            expect(DataRepository.getProgressPictures).toHaveBeenCalledWith("user1");
            expect(result).toEqual(mockPics);
        });
    });

    describe("saveProgressPicture", () => {
        it("should copy image to permanent directory and save in DataRepository", async () => {
            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
            (DataRepository.saveProgressPicture as jest.Mock).mockResolvedValue(undefined);

            const tempUri = "file:///temp/test.jpg";
            const date = new Date("2026-06-28T00:00:00");
            const notes = "Awesome workout";

            const result = await ProgressPictureService.saveProgressPicture("user1", tempUri, date, notes);

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: tempUri,
                to: expect.stringContaining("file:///mock-document-dir/progress_pictures/"),
            });
            expect(DataRepository.saveProgressPicture).toHaveBeenCalledWith(
                "user1",
                expect.objectContaining({
                    imageUri: expect.stringContaining("file:///mock-document-dir/progress_pictures/"),
                    date: "2026-06-28",
                    notes: "Awesome workout",
                })
            );
            expect(result.id).toBeDefined();
            expect(result.date).toBe("2026-06-28");
            expect(result.notes).toBe("Awesome workout");
        });
    });

    describe("deleteProgressPicture", () => {
        it("should delete from DataRepository and remove local file", async () => {
            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
            (DataRepository.deleteProgressPicture as jest.Mock).mockResolvedValue(undefined);

            const picId = "pic123";
            const imageUri = "file:///mock-path/pic123.jpg";

            await ProgressPictureService.deleteProgressPicture(picId, imageUri);

            expect(DataRepository.deleteProgressPicture).toHaveBeenCalledWith(picId);
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith(imageUri, { idempotent: true });
        });
    });
});
