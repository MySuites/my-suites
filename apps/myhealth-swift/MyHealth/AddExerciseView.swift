import MyHealthKit
import SwiftData
import SwiftUI

// Ported from apps/myhealth/app/exercises/create.tsx. The RN version's
// full-screen picker modals become plain Pickers/multi-select lists here —
// same fields (name, properties, primary/secondary muscle groups, location
// tracking), simpler presentation.
struct AddExerciseView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var selectedProperties: Set<ExerciseProperty> = [.weighted, .reps]
    @State private var locationTracking = false
    @State private var primaryMuscle: String?
    @State private var secondaryMuscles: Set<String> = []
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Name") {
                    TextField("e.g. Bench Press", text: $name)
                }

                Section("Properties") {
                    ForEach(ExerciseProperty.allCases, id: \.self) { property in
                        Toggle(property.rawValue, isOn: Binding(
                            get: { selectedProperties.contains(property) },
                            set: { isOn in
                                if isOn { selectedProperties.insert(property) } else { selectedProperties.remove(property) }
                            }
                        ))
                    }
                    Toggle("Allow location tracking", isOn: $locationTracking)
                }

                Section("Primary Muscle Group") {
                    Picker("Primary Muscle Group", selection: $primaryMuscle) {
                        Text("Select…").tag(String?.none)
                        ForEach(muscleGroups, id: \.self) { muscle in
                            Text(muscle).tag(String?.some(muscle))
                        }
                    }
                    .pickerStyle(.navigationLink)
                    .labelsHidden()
                }

                Section("Secondary Muscle Groups") {
                    ForEach(muscleGroups.filter { $0 != primaryMuscle }, id: \.self) { muscle in
                        Toggle(muscle, isOn: Binding(
                            get: { secondaryMuscles.contains(muscle) },
                            set: { isOn in
                                if isOn { secondaryMuscles.insert(muscle) } else { secondaryMuscles.remove(muscle) }
                            }
                        ))
                    }
                }
            }
            .navigationTitle("New Exercise")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || primaryMuscle == nil)
                }
            }
            .alert("Error", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
    }

    private func save() {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let primaryMuscle else { return }

        var properties = selectedProperties.map(\.rawValue)
        if locationTracking { properties.append("Location") }

        let record = ExerciseRecord(
            id: UUID().uuidString,
            name: trimmed,
            muscleGroups: [primaryMuscle] + secondaryMuscles.sorted(),
            properties: properties
        )
        let repository = WorkoutRepository(context: modelContext)
        do {
            try repository.saveExercises([record])
            dismiss()
        } catch {
            errorMessage = "Failed to create exercise"
        }
    }
}

#Preview {
    AddExerciseView()
        .modelContainer(for: MyHealthSchema.models, inMemory: true)
}
