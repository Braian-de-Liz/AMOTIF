import SignalsmithStretch from 'signalsmith-stretch';
import { needsProcessing } from './tempo';

/**
 * Antecedência com que o stretch começa a tocar dentro do render offline.
 * O nó compensa a própria latência se a mudança for agendada com folga
 * (README do signalsmith-stretch); o trecho inicial é descartado depois.
 */
const LEAD_SECONDS = 0.5;
const TAIL_SECONDS = 0.25;

/** Limite de espera para o AudioWorklet/WASM ficar pronto. */
const READY_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), ms);
        promise.then(
            value => { clearTimeout(timer); resolve(value); },
            err => { clearTimeout(timer); reject(err); }
        );
    });
}

/**
 * Renderiza a camada com outro andamento e/ou tom, preservando a afinação no ajuste de tempo.
 * @param rate velocidade (projectBpm / layerBpm): 1.1 = 10% mais rápido
 * @param semitones transposição, independente do tempo
 * Devolve o próprio buffer quando não há ajuste.
 */
async function renderStretched(input: AudioBuffer, rate: number, semitones: number): Promise<AudioBuffer> {
    if (!needsProcessing(rate, semitones)) return input;
    if (!(rate > 0)) throw new Error('Velocidade inválida para o ajuste de tempo.');

    const channels = input.numberOfChannels;
    const sampleRate = input.sampleRate;
    const outFrames = Math.ceil((input.duration / rate) * sampleRate);
    const leadFrames = Math.round(LEAD_SECONDS * sampleRate);
    const totalFrames = leadFrames + outFrames + Math.round(TAIL_SECONDS * sampleRate);

    const ctx = new OfflineAudioContext(channels, totalFrames, sampleRate);

    const stretch = await withTimeout(
        SignalsmithStretch(ctx, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [channels] }),
        READY_TIMEOUT_MS,
        'O motor de ajuste de tempo não carregou. Atualize o navegador e tente novamente.'
    );
    stretch.connect(ctx.destination);

    const latency = await stretch.latency();
    if (latency > LEAD_SECONDS) {
        throw new Error(`Latência do motor (${latency.toFixed(2)}s) maior que a folga do render.`);
    }

    const data = Array.from({ length: channels }, (_, c) => input.getChannelData(c).slice());
    await stretch.addBuffers(data, data.map(d => d.buffer));
    await stretch.schedule({ active: true, input: 0, output: LEAD_SECONDS, rate, semitones });

    const rendered = await ctx.startRendering();

    // Descarta a folga inicial: o instante LEAD_SECONDS corresponde ao início da entrada.
    const out = new AudioBuffer({ numberOfChannels: channels, length: outFrames, sampleRate });
    for (let c = 0; c < channels; c++) {
        out.copyToChannel(rendered.getChannelData(c).subarray(leadFrames, leadFrames + outFrames), c);
    }
    return out;
}

export { renderStretched, LEAD_SECONDS };
