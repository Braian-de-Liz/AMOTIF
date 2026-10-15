declare module '*.css' {}

/** signalsmith-stretch não publica tipos; só declaramos o que o AMOTIF usa. */
declare module 'signalsmith-stretch' {
    interface StretchSchedule {
        active?: boolean
        /** Tempo do contexto em que a mudança vale (s). */
        output?: number
        /** Posição no buffer de entrada (s). */
        input?: number
        /** Velocidade de reprodução: 1.1 = 10% mais rápido. */
        rate?: number
        semitones?: number
        tonalityHz?: number
        formantSemitones?: number
        formantCompensation?: boolean
        formantBaseHz?: number
        loopStart?: number
        loopEnd?: number
    }

    interface StretchNode extends AudioWorkletNode {
        inputTime: number
        schedule(change: StretchSchedule): Promise<unknown>
        start(when?: number | StretchSchedule): Promise<unknown>
        stop(when?: number): Promise<unknown>
        addBuffers(channels: Float32Array[], transfer?: Transferable[]): Promise<number>
        dropBuffers(toSeconds?: number): Promise<{ start: number; end: number }>
        latency(): Promise<number>
        configure(config: { blockMs?: number | null; intervalMs?: number; splitComputation?: boolean; preset?: 'default' | 'cheaper' }): Promise<unknown>
    }

    function SignalsmithStretch(context: BaseAudioContext, options?: AudioWorkletNodeOptions): Promise<StretchNode>

    export type { StretchNode, StretchSchedule }
    export default SignalsmithStretch
}
