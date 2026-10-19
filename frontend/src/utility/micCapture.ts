// Captura "crua" para música: os filtros de voz do navegador (cancelamento de eco,
// supressão de ruído e controle automático de ganho) são feitos para chamadas e
// abafam, distorcem e fazem o volume "respirar" em instrumentos.
const MIC_CONSTRAINTS: MediaStreamConstraints = {
    audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: { ideal: 2 },
        sampleRate: { ideal: 48000 },
    },
};

// Opus padrão do MediaRecorder fica em ~32 kbps, baixo demais para música.
const RECORDER_BITRATE = 192_000;

// O upload (novoStudio, LayerEditorModal) assume .webm para tudo que não é WAV.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm'];

function openMicStream(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
}

function recorderOptions(): MediaRecorderOptions & { mimeType: string } {
    const mimeType = MIME_CANDIDATES.find(t => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';
    return { mimeType, audioBitsPerSecond: RECORDER_BITRATE };
}

export { openMicStream, recorderOptions, MIC_CONSTRAINTS, RECORDER_BITRATE };
