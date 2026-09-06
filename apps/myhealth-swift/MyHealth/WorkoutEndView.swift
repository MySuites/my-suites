import MyHealthKit
import PhotosUI
import SwiftUI

// Ported from apps/myhealth/app/workouts/end.tsx. Route/map snapshot export
// is not ported (RouteSnapshotMap, MapView.takeSnapshot) — GPS distance and
// elevation still get saved with the log via ActiveWorkoutStore, only the
// visual map thumbnail/export is skipped. Auto-save-to-Photos-library reuses
// the same `autoSavePhotosToGallery` setting as the RN version.
struct WorkoutEndView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ActiveWorkoutStore.self) private var store
    @Environment(SettingsStore.self) private var settings

    let onFinished: () -> Void

    @State private var notes = ""
    @State private var photoSelections: [PhotosPickerItem] = []
    @State private var pendingImages: [UIImage] = []
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Summary") {
                    LabeledContent("Duration", value: formatSeconds(store.workoutSeconds))
                    LabeledContent("Exercises", value: "\(completedExerciseCount)")
                    LabeledContent("Sets Completed", value: "\(completedSetCount)")
                }

                Section("Progress Photos") {
                    if !pendingImages.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(Array(pendingImages.enumerated()), id: \.offset) { index, image in
                                    ZStack(alignment: .topTrailing) {
                                        Image(uiImage: image)
                                            .resizable()
                                            .scaledToFill()
                                            .frame(width: 90, height: 120)
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                        Button {
                                            pendingImages.remove(at: index)
                                        } label: {
                                            Image(systemName: "xmark.circle.fill").foregroundStyle(.white, .black.opacity(0.6))
                                        }
                                        .padding(4)
                                    }
                                }
                            }
                        }
                    }
                    PhotosPicker("Add Photos", selection: $photoSelections, matching: .images)
                        .onChange(of: photoSelections) { _, newItems in
                            Task { await loadImages(from: newItems) }
                        }
                }

                Section("Notes") {
                    TextEditor(text: $notes).frame(minHeight: 80)
                }

                Section {
                    Button("Discard Workout", role: .destructive) {
                        store.cancelWorkout()
                        onFinished()
                    }
                }
            }
            .navigationTitle("Finish Workout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving…" : "Save") { save() }
                        .disabled(isSaving)
                }
            }
        }
    }

    private var completedExerciseCount: Int {
        store.exercises.filter { $0.completedSets > 0 }.count
    }
    private var completedSetCount: Int {
        store.exercises.reduce(0) { $0 + $1.completedSets }
    }

    private func loadImages(from items: [PhotosPickerItem]) async {
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self), let image = UIImage(data: data) {
                pendingImages.append(image)
            }
        }
        photoSelections = []
    }

    private func save() {
        isSaving = true
        var imageUrls: [String] = []
        for image in pendingImages {
            guard let data = image.jpegData(compressionQuality: 0.8),
                  let url = try? ProgressPictureFileStore.save(data) else { continue }
            imageUrls.append(url.absoluteString)
            if settings.autoSavePhotosToGallery {
                UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
            }
        }
        store.finishWorkout(note: notes.isEmpty ? nil : notes, imageUrls: imageUrls)
        isSaving = false
        onFinished()
    }
}
