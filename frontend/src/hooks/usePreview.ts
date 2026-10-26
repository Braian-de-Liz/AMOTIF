import { useSyncExternalStore } from 'react';
import { previewPlayer } from '../utility/previewPlayer';

type PreviewStatus = 'idle' | 'paused' | 'playing';

/** Estado da prévia de um card. Devolve um valor primitivo para que só o card afetado renderize de novo. */
function usePreviewStatus(id: string): PreviewStatus {
    return useSyncExternalStore(previewPlayer.subscribe, () => {
        const { id: activeId, playing } = previewPlayer.getState();
        if (activeId !== id) return 'idle';
        return playing ? 'playing' : 'paused';
    });
}

/** Progresso da prévia ativa (0–1). Atualiza várias vezes por segundo: use só no card ativo. */
function usePreviewProgress(): number {
    return useSyncExternalStore(previewPlayer.subscribe, () => previewPlayer.getState().progress);
}

export { usePreviewStatus, usePreviewProgress };
export type { PreviewStatus };
