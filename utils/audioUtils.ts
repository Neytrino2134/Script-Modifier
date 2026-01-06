export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as ArrayBuffer);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Interleaves and converts Float32 planar audio to 16-bit PCM.
function toPCM(buffer: AudioBuffer): Int16Array {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const result = new Int16Array(length * numChannels);
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let offset = 0;
    for (let i = 0; i < length; i++) {
        for (let j = 0; j < numChannels; j++) {
            const sample = Math.max(-1, Math.min(1, channels[j][i]));
            result[offset++] = sample < 0 ? sample * 32768 : sample * 32767;
        }
    }
    return result;
}

// Writes a string to a DataView.
function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
    const pcmData = toPCM(buffer);
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.byteLength, true);
    writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size for PCM
    view.setUint16(20, 1, true); // AudioFormat for PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.byteLength, true);

    return new Blob([view, pcmData], { type: 'audio/wav' });
}