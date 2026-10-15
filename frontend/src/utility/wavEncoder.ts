/**
 * WAV PCM 16-bit a partir de canais Float32. Usado só para a prévia local no estúdio
 * (rápido e sem perda); o arquivo enviado ao servidor é MP3.
 */
function encodeWav(channels: Float32Array[], sampleRate: number): Blob {
    const numChannels = channels.length;
    const numFrames = channels[0]?.length ?? 0;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = numFrames * blockAlign;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, text: string) => {
        for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);              // tamanho do bloco fmt
    view.setUint16(20, 1, true);               // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);              // bits por amostra
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
        for (let c = 0; c < numChannels; c++) {
            const s = Math.max(-1, Math.min(1, channels[c][i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function audioBufferToWav(audio: AudioBuffer): Blob {
    const channels = Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c));
    return encodeWav(channels, audio.sampleRate);
}

export { encodeWav, audioBufferToWav };
