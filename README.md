#  Virtual Piano - Hand Tracking

A web-based virtual piano that you can play using hand gestures and movements, powered by MediaPipe and Tone.js.

## Features

- **Hand Tracking**: Uses MediaPipe to detect and track hand movements in real-time
- **Gesture Recognition**: Recognizes open hand, pointing gestures, and fist positions
- **Piano Interface**: Visual piano keyboard with 2 octaves (C4 to C6)
- **Real-time Audio**: Generates musical notes using Tone.js synthesizer
- **Octave Control**: Change octaves by moving your finger up/down
- **Volume Control**: Adjustable volume slider
- **Visual Feedback**: Real-time display of current note, octave, and frequency
- **Responsive Design**: Works on desktop and mobile devices

## How to Play

1. **Start the Camera**: Click the "Start Camera" button
2. **Open Your Hand**: Extend your fingers to activate the piano
3. **Point to Play**: Point with your index finger to play notes
4. **Change Octaves**: Move your finger up/down to change octaves
5. **Stop Playing**: Close your fist or move your hand away

## Controls

- **Start/Stop Camera**: Toggle camera and audio
- **Volume Slider**: Adjust the volume (0-100%)
- **Visual Piano**: Click keys manually as an alternative

## Technical Details

### Technologies Used

- **MediaPipe**: Google's framework for hand detection and tracking
- **Tone.js**: Web Audio API library for sound synthesis
- **HTML5 Canvas**: For rendering hand landmarks and visual feedback
- **CSS3**: Modern styling with gradients and animations

### Hand Gesture Recognition

- **Open Hand**: Detects when 3+ fingers are extended
- **Pointing**: Recognizes when index finger is pointing
- **Position Mapping**: Maps hand position to piano notes and octaves

### Audio Synthesis

- **Oscillator**: Sine wave generator
- **Envelope**: Attack, decay, sustain, release (ADSR) envelope
- **Frequency Range**: C3 to C6 (approximately 130Hz to 1047Hz)

## Installation

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. Allow camera permissions when prompted
4. Click "Start Camera" to begin playing

## Requirements

- Modern web browser with WebRTC support
- Camera access
- Internet connection (for MediaPipe and Tone.js CDNs)

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Camera Issues
- Ensure camera permissions are granted
- Try refreshing the page
- Check if another application is using the camera

### Audio Issues
- Click "Start Camera" to initialize audio context
- Check browser audio settings
- Ensure volume is not muted

### Performance Issues
- Close other browser tabs
- Ensure good lighting for hand detection
- Keep hands within camera view

## Future Enhancements

- [ ] Multiple hand support
- [ ] Different instrument sounds
- [ ] Recording and playback
- [ ] Chord detection
- [ ] MIDI output support
- [ ] Customizable key mappings
- [ ] Hand gesture tutorials

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this project!

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Google MediaPipe team for the excellent hand tracking framework
- Tone.js team for the powerful audio synthesis library
- Web Audio API for enabling real-time audio processing
