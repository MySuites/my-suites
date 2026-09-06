import MyHealthKit
import PhotosUI
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/progress-pictures/add.tsx.
// PhotosPicker (PhotosUI) replaces expo-image-picker's library flow;
// UIImagePickerController still backs the camera capture flow (no first-party
// SwiftUI camera API exists yet on this OS baseline).
struct AddProgressPictureView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var photoSelections: [PhotosPickerItem] = []
    @State private var pendingImages: [UIImage] = []
    @State private var photoDate = Date()
    @State private var notes = ""
    @State private var isSaving = false
    @State private var showCamera = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Photos") {
                    if !pendingImages.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(Array(pendingImages.enumerated()), id: \.offset) { index, image in
                                    ZStack(alignment: .topTrailing) {
                                        Image(uiImage: image)
                                            .resizable()
                                            .scaledToFill()
                                            .frame(width: 110, height: 150)
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
                                        Button {
                                            pendingImages.remove(at: index)
                                        } label: {
                                            Image(systemName: "xmark.circle.fill")
                                                .foregroundStyle(.white, .black.opacity(0.6))
                                        }
                                        .padding(4)
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }

                    PhotosPicker("Choose from Library", selection: $photoSelections, matching: .images)
                        .onChange(of: photoSelections) { _, newItems in
                            Task { await loadImages(from: newItems) }
                        }
                    Button("Take Photo") { showCamera = true }
                }

                Section("Photo Date") {
                    DatePicker("Date", selection: $photoDate, in: ...Date.now, displayedComponents: .date)
                        .labelsHidden()
                }

                Section("Notes (optional)") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }
            }
            .navigationTitle("Add Progress Picture")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        save()
                    } label: {
                        if isSaving {
                            ProgressView()
                        } else {
                            Text(pendingImages.count > 1 ? "Save (\(pendingImages.count))" : "Save")
                        }
                    }
                    .disabled(pendingImages.isEmpty || isSaving)
                }
            }
            .alert("Error", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
            .sheet(isPresented: $showCamera) {
                CameraCapture { image in
                    if let image { pendingImages.append(image) }
                }
                .ignoresSafeArea()
            }
        }
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
        guard !pendingImages.isEmpty else { return }
        isSaving = true
        defer { isSaving = false }

        let repository = WorkoutRepository(context: modelContext)
        do {
            for image in pendingImages {
                guard let data = image.jpegData(compressionQuality: 0.8) else { continue }
                let id = UUID().uuidString
                let url = try ProgressPictureFileStore.save(data, id: id)
                let record = ProgressPictureRecord(id: id, imageUri: url.absoluteString, date: photoDate, notes: notes)
                try repository.saveProgressPicture(record)
            }
            dismiss()
        } catch {
            errorMessage = "Failed to save progress picture(s)"
        }
    }
}

// MARK: - Camera capture (UIImagePickerController wrapper)

private struct CameraCapture: UIViewControllerRepresentable {
    let onCapture: (UIImage?) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraCapture
        init(_ parent: CameraCapture) { self.parent = parent }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            parent.onCapture(info[.editedImage] as? UIImage ?? info[.originalImage] as? UIImage)
            parent.dismiss()
        }
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

#Preview {
    AddProgressPictureView()
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
