import CoreLocation
import MyHealthKit
import PhotosUI
import SwiftUI

// Ported from apps/myhealth/app/workouts/end.tsx, including the route
// thumbnail (RouteSnapshotMap) — GPS tracking is still live at this point
// (finishWorkout/stopTracking hasn't run yet), so the thumbnail reads
// LocationTrackingService's in-progress buffer directly. Auto-save-to-
// Photos-library reuses the same `autoSavePhotosToGallery` setting as the RN
// version.
struct WorkoutEndView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ActiveWorkoutStore.self) private var store
    @Environment(SettingsStore.self) private var settings

    let onFinished: () -> Void

    @State private var notes = ""
    @State private var photoSelections: [PhotosPickerItem] = []
    @State private var pendingImages: [UIImage] = []
    @State private var isSaving = false
    @State private var showFullRoute = false
    @State private var routePoints: [LocationTrackingService.TrackedRoutePoint] = []

    var body: some View {
        NavigationStack {
            Form {
                Section("Summary") {
                    LabeledContent("Duration", value: formatSeconds(store.workoutSeconds))
                    LabeledContent("Exercises", value: "\(completedExerciseCount)")
                    LabeledContent("Sets Completed", value: "\(completedSetCount)")
                }

                if store.isGpsTrackingActive && routePoints.count >= 2 {
                    Section("Route") {
                        Button {
                            showFullRoute = true
                        } label: {
                            RouteSnapshotMapView(coordinates: routeCoordinates)
                                .frame(height: 140)
                        }
                        .buttonStyle(.plain)
                    }
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
                ToolbarItem(placement: .cancellationAction) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "chevron.left")
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving…" : "Save") { save() }
                        .disabled(isSaving)
                }
            }
            .onAppear {
                #if os(iOS)
                routePoints = LocationTrackingService.shared.liveRoute()
                #endif
            }
            .fullScreenCover(isPresented: $showFullRoute) {
                ZStack(alignment: .topLeading) {
                    RouteSnapshotMapView(coordinates: routeCoordinates, interactive: true)
                        .ignoresSafeArea()
                    Button {
                        showFullRoute = false
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title)
                            .foregroundStyle(.white, .black.opacity(0.4))
                    }
                    .padding()
                }
            }
        }
    }

    private var routeCoordinates: [CLLocationCoordinate2D] {
        routePoints.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) }
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
