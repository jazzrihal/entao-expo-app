import CoreHaptics
import ExpoModulesCore

public class CaptureHapticsModule: Module {
  private var engine: CHHapticEngine?
  private var blipPlayer: CHHapticPatternPlayer?
  private var rampPlayer: CHHapticPatternPlayer?

  public func definition() -> ModuleDefinition {
    Name("CaptureHaptics")

    OnCreate { [weak self] in
      self?.onMain {
        self?.ensureEngine()
      }
    }

    OnDestroy { [weak self] in
      self?.onMain {
        self?.stopRampPlayer()
        self?.blipPlayer = nil
        self?.engine?.stop()
        self?.engine = nil
      }
    }

    Function("playShutterBlip") { [weak self] in
      self?.playShutterBlip()
    }

    Function("playDevelopRamp") { [weak self] (durationMs: Double) in
      self?.playDevelopRamp(durationMs: durationMs)
    }

    Function("stopDevelopRamp") { [weak self] in
      self?.stopDevelopRamp()
    }
  }

  private func onMain(_ work: @escaping () -> Void) {
    if Thread.isMainThread {
      work()
    } else {
      DispatchQueue.main.async(execute: work)
    }
  }

  @discardableResult
  private func ensureEngine() -> CHHapticEngine? {
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else {
      return nil
    }

    if let engine {
      return engine
    }

    do {
      let engine = try CHHapticEngine()
      engine.resetHandler = { [weak engine] in
        do {
          try engine?.start()
        } catch {
          // The next playback calls start() again.
        }
      }
      try engine.start()
      self.engine = engine
      return engine
    } catch {
      return nil
    }
  }

  private func playShutterBlip() {
    onMain {
      guard let engine = self.ensureEngine() else {
        return
      }

      do {
        let intensity = CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.85)
        let sharpness = CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.8)
        let event = CHHapticEvent(
          eventType: .hapticTransient,
          parameters: [intensity, sharpness],
          relativeTime: 0
        )
        let pattern = try CHHapticPattern(events: [event], parameters: [])
        let player = try engine.makePlayer(with: pattern)
        try engine.start()
        try player.start(atTime: CHHapticTimeImmediate)
        self.blipPlayer = player
      } catch {
        // No-op when the engine cannot play.
      }
    }
  }

  private func playDevelopRamp(durationMs: Double) {
    onMain {
      let duration = durationMs / 1000
      guard duration > 0, let engine = self.ensureEngine() else {
        return
      }

      self.stopRampPlayer()

      do {
        let intensity = CHHapticEventParameter(parameterID: .hapticIntensity, value: 1)
        let sharpness = CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.3)
        let event = CHHapticEvent(
          eventType: .hapticContinuous,
          parameters: [intensity, sharpness],
          relativeTime: 0,
          duration: duration
        )
        let curve = CHHapticParameterCurve(
          parameterID: .hapticIntensityControl,
          controlPoints: [
            .init(relativeTime: 0, value: 0.12),
            .init(relativeTime: duration, value: 1),
          ],
          relativeTime: 0
        )
        let pattern = try CHHapticPattern(events: [event], parameterCurves: [curve])
        let player = try engine.makePlayer(with: pattern)
        try engine.start()
        try player.start(atTime: CHHapticTimeImmediate)
        self.rampPlayer = player
      } catch {
        self.rampPlayer = nil
      }
    }
  }

  private func stopDevelopRamp() {
    onMain {
      self.stopRampPlayer()
    }
  }

  private func stopRampPlayer() {
    guard let rampPlayer else {
      return
    }
    try? rampPlayer.stop(atTime: CHHapticTimeImmediate)
    self.rampPlayer = nil
  }
}
