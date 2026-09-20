import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(.green)
                .accessibilityHidden(true)

            Text("SPrivate")
                .font(.largeTitle.bold())

            Text("iOS 27 development environment is ready")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .accessibilityIdentifier("environment-ready-message")
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
