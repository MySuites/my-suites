import MyHealthKit
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/progress-pictures/index.tsx. Muscle-group AI
// analysis (analyzeProgressPicture, the queued/analyzing badges) is dropped —
// see memory note "AI muscle-group JSON reliability": on-device VLM output
// is unreliable and that whole feature is deferred, not part of this port.
struct ProgressPicturesListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \ProgressPictureRecord.date, order: .reverse) private var pictures: [ProgressPictureRecord]

    @Binding var showAddSheet: Bool
    @Binding var scrollToTopTick: Int

    @State private var selectedPicture: ProgressPictureRecord?
    @State private var pictureToDelete: ProgressPictureRecord?

    private let columns = [GridItem(.adaptive(minimum: 100), spacing: 10)]

    var body: some View {
        NavigationStack {
                VStack(spacing: 0) {
                ZStack {
                    Text("Progress Pictures")
                        .font(.largeTitle.weight(.bold))
                        .frame(maxWidth: .infinity, alignment: .center)
                    HStack {
                        SidebarToggleButton()
                        Spacer()
                    }
                }
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                    .padding(.bottom, 8)
                    .background(Color(.systemBackground))

                    ScrollViewReader { proxy in
                            ScrollView {
                                Color.clear.frame(height: 1).id("top")
                                if pictures.isEmpty {
                                    ContentUnavailableView {
                                        Label("No Pictures Yet", systemImage: "camera.fill")
                                    } description: {
                                        Text("Take progress photos regularly to visualise your body transformation and track muscle gain.")
                                    } actions: {
                                        Button("Add First Picture") { showAddSheet = true }
                                    }
                                } else {
                                    LazyVGrid(columns: columns, spacing: 12) {
                                        ForEach(pictures) { picture in
                                            Button {
                                                selectedPicture = picture
                                            } label: {
                                                thumbnail(for: picture)
                                            }
                                            .buttonStyle(.plain)
                                        }
                                    }
                                    .padding(16)
                                }
                            }
                            .onChange(of: scrollToTopTick) {
                                withAnimation { proxy.scrollTo("top", anchor: .top) }
                            }
                    }
                }
                .background(Color(.systemBackground))
            .background(Color(.systemBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showAddSheet) {
                AddProgressPictureView()
            }
            .sheet(item: $selectedPicture) { picture in
                ProgressPictureDetailView(picture: picture) {
                    pictureToDelete = picture
                    selectedPicture = nil
                }
            }
            .alert("Delete Picture", isPresented: Binding(get: { pictureToDelete != nil }, set: { if !$0 { pictureToDelete = nil } })) {
                Button("Cancel", role: .cancel) { pictureToDelete = nil }
                Button("Delete", role: .destructive) {
                    if let picture = pictureToDelete { delete(picture) }
                    pictureToDelete = nil
                }
            } message: {
                Text("Are you sure you want to delete this progress picture permanently?")
            }
        }
    }

    private func thumbnail(for picture: ProgressPictureRecord) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            LocalImage(uri: picture.imageUri)
                .aspectRatio(1, contentMode: .fill)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            Text(picture.date, format: .dateTime.year().month().day())
                .font(.system(size: 11, weight: .bold))
            if !picture.notes.isEmpty {
                Text(picture.notes)
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
    }

    private func delete(_ picture: ProgressPictureRecord) {
        let repository = WorkoutRepository(context: modelContext)
        ProgressPictureFileStore.delete(uri: picture.imageUri)
        try? repository.deleteProgressPicture(id: picture.id)
    }
}

private struct ProgressPictureDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let picture: ProgressPictureRecord
    let onDelete: () -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                LocalImage(uri: picture.imageUri)
                    .aspectRatio(contentMode: .fit)
                    .frame(maxHeight: .infinity)

                VStack(alignment: .leading, spacing: 8) {
                    Text("NOTES").font(.caption2).foregroundStyle(.secondary)
                    Text(picture.notes.isEmpty ? "No notes added to this progress photo." : picture.notes)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
            }
            .background(Color.black)
            .navigationTitle(picture.date.formatted(date: .long, time: .omitted))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
                ToolbarItem(placement: .destructiveAction) {
                    Button(role: .destructive, action: onDelete) {
                        Image(systemName: "trash.fill")
                    }
                }
            }
        }
    }
}

// Loads an image from a file:// URI stored on ProgressPictureRecord — the
// on-disk file ProgressPictureFileStore wrote, not a remote asset.
private struct LocalImage: View {
    let uri: String

    var body: some View {
        if let url = URL(string: uri), let data = try? Data(contentsOf: url), let uiImage = UIImage(data: data) {
            Image(uiImage: uiImage).resizable()
        } else {
            Rectangle().fill(.quaternary).overlay(Image(systemName: "photo"))
        }
    }
}

#Preview {
    ProgressPicturesListView(showAddSheet: .constant(false), scrollToTopTick: .constant(0))
        .environment(NavSelection())
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
