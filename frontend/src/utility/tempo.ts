/**
 * Cálculos de ajuste de tempo (time-stretch) e tom (pitch-shift) por camada.
 *
 * Convenção: ratio > 1 acelera (a camada fica mais curta), ratio < 1 desacelera.
 * A afinação é preservada pelo motor de stretch; a transposição é independente.
 */

/** Faixa em que o stretch soa bem (limite recomendado pelo signalsmith-stretch). */
const MIN_RATIO = 0.75;
const MAX_RATIO = 1.5;

/** Acima de ±20% de ajuste, avisamos que a qualidade pode cair. */
const QUALITY_WARNING_DEVIATION = 0.2;

const MIN_SEMITONES = -12;
const MAX_SEMITONES = 12;

/**
 * Razão de velocidade para levar a camada do BPM em que foi gravada ao BPM do projeto.
 * Metade/dobro contam como o mesmo tempo (ex.: 70 → 140 = 1), então o resultado é
 * dobrado/reduzido à metade até cair perto de 1.
 * Retorna 1 quando layerBpm é nulo (camada já está no tempo do projeto).
 */
function computeStretchRatio(projectBpm: number, layerBpm: number | null | undefined): number {
    if (!layerBpm || !projectBpm || layerBpm <= 0 || projectBpm <= 0) return 1;

    let ratio = projectBpm / layerBpm;

    // Normaliza para [1/√2, √2], o intervalo de oitava de tempo centrado em 1.
    while (ratio > Math.SQRT2) ratio /= 2;
    while (ratio < Math.SQRT1_2) ratio *= 2;

    // Evita reprocessar o áudio por erro de arredondamento (ex.: 0,9999999).
    return Math.abs(ratio - 1) < 1e-6 ? 1 : ratio;
}

/** true se o ajuste é grande o suficiente para gerar artefatos audíveis. */
function isQualityRisk(ratio: number): boolean {
    return Math.abs(ratio - 1) > QUALITY_WARNING_DEVIATION;
}

/** true se o ajuste está fora da faixa suportada pelo motor. */
function isOutOfRange(ratio: number): boolean {
    return ratio < MIN_RATIO || ratio > MAX_RATIO;
}

/** Fator de frequência para uma transposição em semitons (12 = oitava acima = 2×). */
function semitonesToPitchFactor(semitones: number): number {
    return Math.pow(2, semitones / 12);
}

function clampSemitones(semitones: number): number {
    return Math.min(MAX_SEMITONES, Math.max(MIN_SEMITONES, Math.round(semitones)));
}

/** true quando a camada precisa de processamento (tempo ou tom). */
function needsProcessing(ratio: number, semitones: number): boolean {
    return ratio !== 1 || semitones !== 0;
}

/** Rótulo curto do ajuste: "100→110 BPM · +2 st". Vazio se não há ajuste. */
function formatAdjustmentLabel(
    projectBpm: number,
    layerBpm: number | null | undefined,
    semitones: number
): string {
    const partes: string[] = [];
    if (layerBpm && computeStretchRatio(projectBpm, layerBpm) !== 1) {
        partes.push(`${layerBpm}→${projectBpm} BPM`);
    }
    if (semitones) {
        partes.push(`${semitones > 0 ? '+' : ''}${semitones} st`);
    }
    return partes.join(' · ');
}

export {
    MIN_RATIO,
    MAX_RATIO,
    MIN_SEMITONES,
    MAX_SEMITONES,
    QUALITY_WARNING_DEVIATION,
    computeStretchRatio,
    isQualityRisk,
    isOutOfRange,
    semitonesToPitchFactor,
    clampSemitones,
    needsProcessing,
    formatAdjustmentLabel,
};
