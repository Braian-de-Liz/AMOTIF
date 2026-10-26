// Prévia de áudio dos cards do feed: um único <audio> compartilhado, então só uma prévia toca por vez.
// O playbackEngine do Studio é multitrack e pesado demais para isso.

interface PreviewState {
    id: string | null
    playing: boolean
    /** Fração tocada, de 0 a 1. */
    progress: number
}

const IDLE: PreviewState = { id: null, playing: false, progress: 0 };

let audio: HTMLAudioElement | null = null;
let state: PreviewState = IDLE;
const listeners = new Set<() => void>();

function emit(next: PreviewState) {
    state = next;
    listeners.forEach(listener => listener());
}

function getAudio(): HTMLAudioElement {
    if (audio) return audio;

    audio = new Audio();
    audio.preload = 'none';
    audio.addEventListener('timeupdate', () => {
        const el = audio!;
        if (!state.id || !el.duration) return;
        emit({ ...state, progress: Math.min(1, el.currentTime / el.duration) });
    });
    audio.addEventListener('ended', () => emit(IDLE));
    audio.addEventListener('error', () => {
        if (state.id) emit(IDLE);
    });
    return audio;
}

/** Toca a prévia `id`; se ela já está ativa, alterna entre pausar e retomar. Rejeita se o navegador não conseguir tocar. */
async function toggle(id: string, url: string): Promise<void> {
    const el = getAudio();

    if (state.id === id) {
        if (state.playing) {
            el.pause();
            emit({ ...state, playing: false });
            return;
        }
    } else {
        el.pause();
        el.src = url;
        el.currentTime = 0;
        emit({ id, playing: false, progress: 0 });
    }

    emit({ ...state, playing: true });
    try {
        await el.play();
    } catch (err) {
        // Outra prévia pode ter assumido enquanto esta carregava: só limpa se ainda for a ativa.
        if (state.id === id) emit(IDLE);
        throw err;
    }
}

function stop() {
    if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
    }
    if (state !== IDLE) emit(IDLE);
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getState(): PreviewState {
    return state;
}

export const previewPlayer = { toggle, stop, subscribe, getState };
export type { PreviewState };
