// Virtual Piano with Hand Tracking
// Global variables
let synth;
let soundEnabled = false;
let lastPlayedNote = null;
let currentOctave = 4;
let isHandDetected = false;
let frameCount = 0;
let lastTime = 0;
let camera = null;

// DOM elements
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const currentNoteElement = document.getElementById('currentNote');
const currentOctaveElement = document.getElementById('currentOctave');
const currentFreqElement = document.getElementById('currentFreq');
const handStatusElement = document.getElementById('handStatus');
const fpsCounterElement = document.getElementById('fpsCounter');
const pianoKeysElement = document.getElementById('pianoKeys');

// Piano notes (C4 to C6)
const noteScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const octaves = [3, 4, 5, 6];

// Initialize MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// Initialize Tone.js synthesizer
function initializeSynth() {
    // Monophonic synth: index finger controls a single note at a time
    synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { 
            attack: 0.05, 
            decay: 0.15, 
            sustain: 0.6, 
            release: 0.2 
        }
    }).toDestination();
    
    // Set initial volume
    synth.volume.value = Tone.gainToDb(0.5);
}

// Generate piano keys
function generatePianoKeys() {
    pianoKeysElement.innerHTML = '';
    // Render all octaves defined in the octaves[] array
    octaves.forEach((octave) => {
        noteScale.forEach((note) => {
            const key = document.createElement('div');
            key.className = `piano-key ${note.includes('#') ? 'black' : 'white'}`;
            key.textContent = `${note}${octave}`;
            key.dataset.note = `${note}${octave}`;
            pianoKeysElement.appendChild(key);
        });
    });
}

// Check if hand is open (fingers extended)
function isHandOpen(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
    const fingerPips = [3, 6, 10, 14, 18]; // PIP joints
    
    let extendedFingers = 0;
    
    for (let i = 0; i < fingerTips.length; i++) {
        const tip = landmarks[fingerTips[i]];
        const pip = landmarks[fingerPips[i]];
        
        // For thumb, check if it's extended horizontally
        if (i === 0) {
            if (tip.x > pip.x) extendedFingers++;
        } else {
            // For other fingers, check if tip is above PIP
            if (tip.y < pip.y) extendedFingers++;
        }
    }
    
    return extendedFingers >= 3; // At least 3 fingers extended
}

// Check if index finger is pointing
function isIndexFingerPointing(landmarks) {
    const indexTip = landmarks[8];
    const indexPip = landmarks[6];
    const indexMcp = landmarks[5];
    
    // Index finger is pointing if tip is above PIP and PIP is above MCP
    return indexTip.y < indexPip.y && indexPip.y < indexMcp.y;
}

// Return array of fingertip landmark indices that are extended
function getExtendedFingertips(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];
    const extended = [];
    for (let i = 0; i < fingerTips.length; i++) {
        const tip = landmarks[fingerTips[i]];
        const pip = landmarks[fingerPips[i]];
        if (i === 0) {
            // Thumb: horizontal extension heuristic (right hand assumption)
            if (tip.x > pip.x) extended.push(fingerTips[i]);
        } else {
            if (tip.y < pip.y) extended.push(fingerTips[i]);
        }
    }
    return extended;
}

// Map hand position to piano note
function mapHandToNote(landmarks) {
    return mapPointToNote(landmarks[8]);
}

function mapPointToNote(point) {
    // Calculate horizontal position (0 to 1)
    const xPos = 1 - point.x; // Flip horizontally for mirror effect
    // Calculate vertical position for octave selection
    const yPos = point.y;
    // Map X position to note (0-11 for chromatic scale)
    const noteIndex = Math.floor(xPos * noteScale.length);
    const note = noteScale[Math.min(noteIndex, noteScale.length - 1)];
    // Map Y position to octave
    const octaveIndex = Math.floor(yPos * octaves.length);
    const octave = octaves[Math.min(octaveIndex, octaves.length - 1)];
    return `${note}${octave}`;
}

// Play note
function playNote(note) {
    if (!note) return;
    if (note !== lastPlayedNote) {
        if (lastPlayedNote) {
            synth.triggerRelease();
        }
        synth.triggerAttack(note);
        lastPlayedNote = note;
        // Update UI
        currentNoteElement.textContent = note;
        currentOctaveElement.textContent = note.slice(-1);
        currentFreqElement.textContent = Math.round(Tone.Frequency(note).toFrequency());
        // Highlight current key
        const allKeys = document.querySelectorAll('.piano-key');
        allKeys.forEach(k => k.classList.remove('active'));
        const el = document.querySelector(`[data-note="${note}"]`);
        if (el) el.classList.add('active');
    }
}

// Stop playing
function stopPlaying() {
    if (lastPlayedNote) {
        synth.triggerRelease();
        lastPlayedNote = null;
        currentNoteElement.textContent = 'None';
        currentFreqElement.textContent = '0';
        currentOctaveElement.textContent = '-';
        const allKeys = document.querySelectorAll('.piano-key');
        allKeys.forEach(k => k.classList.remove('active'));
    }
}

// Highlight piano key
function updateKeyHighlights() {
    const allKeys = document.querySelectorAll('.piano-key');
    allKeys.forEach(k => k.classList.remove('active'));
    activeNotes.forEach(n => {
        const el = document.querySelector(`[data-note="${n}"]`);
        if (el) el.classList.add('active');
    });
}

function updateNowPlayingUI() {
    if (activeNotes.size === 0) {
        currentNoteElement.textContent = 'None';
        currentFreqElement.textContent = '0';
        currentOctaveElement.textContent = '-';
        return;
    }
    const notes = Array.from(activeNotes);
    currentNoteElement.textContent = notes.join(', ');
    const first = notes[0];
    currentOctaveElement.textContent = first.slice(-1);
    currentFreqElement.textContent = Math.round(Tone.Frequency(first).toFrequency());
}

// Update FPS counter
function updateFPS() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
        fpsCounterElement.textContent = frameCount;
        frameCount = 0;
        lastTime = currentTime;
    }
}

// MediaPipe results handler
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Flip horizontally for mirror effect
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);
    
    // Draw webcam frame
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    // Process hand landmarks
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Draw hand landmarks
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 2
        });
        drawLandmarks(canvasCtx, landmarks, {
            color: '#FF0000',
            lineWidth: 2
        });
        
        // Index finger only: play when hand open and index is pointing
        if (isHandOpen(landmarks) && isIndexFingerPointing(landmarks)) {
            isHandDetected = true;
            const note = mapHandToNote(landmarks);
            handStatusElement.textContent = 'Hand detected - Playing (index)';
            handStatusElement.className = 'hand-status detected';
            playNote(note);
        } else {
            isHandDetected = true;
            handStatusElement.textContent = 'Hand detected - Not pointing';
            handStatusElement.className = 'hand-status detected';
            stopPlaying();
        }
    } else {
        isHandDetected = false;
        handStatusElement.textContent = 'No hand detected';
        handStatusElement.className = 'hand-status not-detected';
        stopPlaying();
    }
    
    canvasCtx.restore();
    updateFPS();
}

// Set up MediaPipe
hands.onResults(onResults);

// Event listeners
startButton.addEventListener('click', async () => {
    try {
        console.log('Starting camera...');
        
        // Initialize audio first
        await Tone.start();
        console.log('Audio context started');
        
        // Initialize synthesizer
        initializeSynth();
        soundEnabled = true;
        console.log('Synthesizer initialized');
        
        // Start camera
        camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });
        
        await camera.start();
        console.log('Camera started successfully');
        
        // Show/hide buttons
        startButton.style.display = 'none';
        stopButton.style.display = 'inline-block';
        
        // Update status
        handStatusElement.textContent = 'Camera started - Show your hand';
        handStatusElement.className = 'hand-status detected';
        
    } catch (error) {
        console.error('Error starting virtual piano:', error);
        alert('Error starting the application: ' + error.message + '\n\nPlease check:\n1. Camera permissions are granted\n2. Camera is not being used by another application\n3. You are using HTTPS or localhost');
    }
});

stopButton.addEventListener('click', () => {
    try {
        console.log('Stopping camera...');
        
        // Stop camera
        if (camera) {
            camera.stop();
            camera = null;
        }
        
        // Stop audio
        if (synth) {
            synth.dispose();
            synth = null;
        }
        soundEnabled = false;
        
        // Show/hide buttons
        startButton.style.display = 'inline-block';
        stopButton.style.display = 'none';
        
        // Reset UI
        stopPlaying();
        handStatusElement.textContent = 'Camera stopped';
        handStatusElement.className = 'hand-status not-detected';
        
        console.log('Virtual Piano stopped!');
    } catch (error) {
        console.error('Error stopping virtual piano:', error);
    }
});

// Volume control
volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    if (synth) {
        synth.volume.value = Tone.gainToDb(volume);
    }
    volumeValue.textContent = `${e.target.value}%`;
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Virtual Piano initializing...');
    generatePianoKeys();
    console.log('Virtual Piano initialized. Click "Start Camera" to begin!');
});
