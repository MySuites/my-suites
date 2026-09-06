import Foundation

// Ported from the file-copy half of apps/myhealth/services/ProgressPictureService.ts
// (`saveProgressPicture`/`deleteProgressPicture`'s FileSystem calls) — the
// SwiftData row itself is handled by WorkoutRepository, this just owns the
// on-disk image file living alongside it.
public enum ProgressPictureFileStore {
    private static var directory: URL {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("progress_pictures", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }

    @discardableResult
    public static func save(_ imageData: Data, id: String = UUID().uuidString) throws -> URL {
        let url = directory.appendingPathComponent(id).appendingPathExtension("jpg")
        try imageData.write(to: url)
        return url
    }

    public static func delete(uri: String) {
        guard let url = URL(string: uri) ?? URL(string: "file://\(uri)") else { return }
        try? FileManager.default.removeItem(at: url)
    }
}
