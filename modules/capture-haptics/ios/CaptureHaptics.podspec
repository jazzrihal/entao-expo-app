Pod::Spec.new do |s|
  s.name           = 'CaptureHaptics'
  s.version        = '1.0.0'
  s.summary        = 'Core Haptics for the camera shutter and develop fade'
  s.description    = 'Plays a transient shutter blip and a continuous develop ramp while the camera session stays running.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.frameworks     = 'CoreHaptics'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
