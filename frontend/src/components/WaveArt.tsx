interface WaveArtProps {
    /** `skeleton` anima as barras (carregando); `still` é só ilustração. */
    variant?: 'skeleton' | 'still'
    bars?: number
    className?: string
}

// Alturas fixas (0–1) com cara de forma de onda; determinísticas para não "piscar" a cada render.
const SHAPE = [0.25, 0.4, 0.62, 0.35, 0.8, 0.55, 0.95, 0.5, 0.7, 0.3, 0.85, 0.6, 0.4, 0.75, 0.45, 0.9, 0.35, 0.65, 0.5, 0.3];

/** Forma de onda decorativa: assinatura visual do produto (loading, estado vazio, divisor). */
function WaveArt({ variant = 'still', bars = 40, className = '' }: WaveArtProps) {
    return (
        <div className={`wave-art wave-art-${variant} ${className}`.trim()} aria-hidden="true">
            {Array.from({ length: bars }, (_, i) => (
                <span
                    key={i}
                    style={{
                        height: `${Math.round(SHAPE[i % SHAPE.length] * 100)}%`,
                        animationDelay: `${(i % 10) * 90}ms`,
                    }}
                />
            ))}
        </div>
    );
}

export { WaveArt };
