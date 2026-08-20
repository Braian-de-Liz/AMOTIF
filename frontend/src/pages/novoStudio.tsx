import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Scissors, Send, Check, Music, Loader2 } from 'lucide-react';
import { AudioRecorder } from '../components/AudioRecorder';
import { AudioEditor } from '../components/AudioEditor';
import { URL_API_TESTE } from '../utility/url_apis';
import { projectSchema, generos } from '../schemas/projectSchema';
import { formatZodErrors } from '../utility/validationHelpers';
import { SEOHead } from '../components/SEOHead';
import '../styles/NovoStudio.css';

type Step = 'record' | 'edit' | 'publish';

function NovoStudio() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<Step>('record');
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedDuration, setRecordedDuration] = useState(0);
    const [editedBlob, setEditedBlob] = useState<Blob | null>(null);

    const [titulo, setTitulo] = useState('');
    const [genero, setGenero] = useState('LO_FI');
    const [bpm, setBpm] = useState(120);
    const [detectandoBpm, setDetectandoBpm] = useState(false);
    const [escala, setEscala] = useState('');
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleRecordingComplete = useCallback((blob: Blob, duration: number) => {
        setRecordedBlob(blob);
        setRecordedDuration(duration);
    }, []);

    const handleEditComplete = useCallback((blob: Blob) => {
        setEditedBlob(blob);
        setCurrentStep('publish');
    }, []);

    useEffect(() => {
        if (currentStep !== 'publish' || !editedBlob) return;

        let cancelled = false;

        async function detectarBpm() {
            const blob = editedBlob;
            if (!blob) return;
            setDetectandoBpm(true);
            try {
                const { analyze } = await import('web-audio-beat-detector');
                const audioContext = new AudioContext();
                const arrayBuffer = await blob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const bpmDetectado = await analyze(audioBuffer, { minTempo: 40, maxTempo: 300 });
                if (!cancelled && bpmDetectado && bpmDetectado >= 40 && bpmDetectado <= 300) {
                    setBpm(Math.round(bpmDetectado));
                }
                await audioContext.close();
            } catch {
                // mantém o valor padrão (120) se a detecção falhar
            } finally {
                if (!cancelled) setDetectandoBpm(false);
            }
        }

        detectarBpm();
        return () => { cancelled = true; };
    }, [currentStep, editedBlob]);

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!editedBlob) {
            setSubmitError('Nenhum áudio para publicar.');
            return;
        }

        const validate = projectSchema.safeParse({
            titulo,
            genero,
            bpm: Number(bpm),
            escala: escala || undefined,
            descricao: descricao || undefined,
        });

        if (!validate.success) {
            setSubmitError(formatZodErrors(validate.error));
            return;
        }

        setLoading(true);

        try {
            const ext = editedBlob.type.includes('wav') ? '.wav' : '.webm';
            const fileName = `gravacao_${Date.now()}${ext}`;
            const file = new File([editedBlob], fileName, { type: editedBlob.type });

            const uploadData = new FormData();
            uploadData.append('audio', file);

            const uploadRes = await fetch(`${URL_API_TESTE}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: uploadData,
            });

            if (!uploadRes.ok) {
                const errBody = await uploadRes.json().catch(() => ({}));
                throw new Error(errBody.mensagem || 'Falha ao enviar áudio.');
            }

            const { fileUrl } = await uploadRes.json();

            const audioMeta = {
                nome: fileName,
                tamanhoMB: +(editedBlob.size / 1024 / 1024).toFixed(2),
                duracaoSegundos: +recordedDuration.toFixed(2),
                codec: editedBlob.type.includes('wav') ? 'PCM' : 'opus',
                sampleRate: 44100,
            };

            const response = await fetch(`${URL_API_TESTE}/projetos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    titulo,
                    genero,
                    bpm: Number(bpm),
                    escala: escala || undefined,
                    descricao: descricao || undefined,
                    audio_guia: fileUrl,
                    audio_metadata: audioMeta,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const projetoId = data.projeto?.id || data.id;
                navigate(`/studio/${projetoId}`);
            } else {
                const data = await response.json();
                setSubmitError(data.mensagem || 'Erro ao criar projeto.');
            }
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
        { key: 'record', label: 'Gravar', icon: <Mic size={16} /> },
        { key: 'edit', label: 'Editar', icon: <Scissors size={16} /> },
        { key: 'publish', label: 'Publicar', icon: <Send size={16} /> },
    ];

    const stepIndex = steps.findIndex(s => s.key === currentStep);

    return (
        <div className="novo-studio-page">
            <SEOHead
                title="Novo Studio - Gravar & Publicar"
                description="Grave, edite e publique seu projeto musical diretamente no AMOTIF."
                url="/novo-studio"
            />

            <header className="user-header">
                <h1>Novo Studio</h1>
                <p>Grave, edite e publique seu projeto musical</p>
            </header>

            <div className="studio-stepper">
                {steps.map((step, i) => (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={`step ${currentStep === step.key ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}`}>
                            <span className="step-number">
                                {i < stepIndex ? <Check size={14} /> : i + 1}
                            </span>
                            {step.label}
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`step-connector ${i < stepIndex ? 'completed' : ''}`}></div>
                        )}
                    </div>
                ))}
            </div>

            {currentStep === 'record' && (
                <>
                    <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                    {recordedBlob && (
                        <div className="step-actions">
                            <button
                                className="btn-confirm"
                                onClick={() => setCurrentStep('edit')}
                            >
                                <Scissors size={16} />
                                Prosseguir para Edição
                            </button>
                        </div>
                    )}
                </>
            )}

            {currentStep === 'edit' && recordedBlob && (
                <AudioEditor
                    audioBlob={recordedBlob}
                    audioDuration={recordedDuration}
                    onEdited={handleEditComplete}
                    onBack={() => setCurrentStep('record')}
                />
            )}

            {currentStep === 'publish' && (
                <div className="publish-area">
                    <div className="publish-audio-summary">
                        <div className="publish-audio-icon">
                            <Music size={24} />
                        </div>
                        <div className="publish-audio-info">
                            <h4>Áudio gravado e editado</h4>
                            <p>Duração: {Math.floor(recordedDuration)}s</p>
                        </div>
                    </div>

                    {submitError && <div className="form-error">{submitError}</div>}

                    <form onSubmit={handlePublish}>
                        <div className="form-group">
                            <label htmlFor="ns-titulo">Título do Projeto</label>
                            <input
                                id="ns-titulo"
                                type="text"
                                required
                                placeholder="Ex: Melodia de Outono"
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="ns-genero">Gênero Musical</label>
                            <select
                                id="ns-genero"
                                className="custom-select"
                                value={genero}
                                onChange={e => setGenero(e.target.value)}
                            >
                                {generos.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="ns-bpm">
                                BPM
                                {detectandoBpm && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--texto-secundario)', fontWeight: 400 }}>
                                        <Loader2 size={12} className="spin" />
                                        Detectando...
                                    </span>
                                )}
                                {!detectandoBpm && bpm !== 120 && (
                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--sucesso-texto)', fontWeight: 400, marginLeft: 8 }}>
                                        Auto-detectado
                                    </span>
                                )}
                            </label>
                            <input
                                id="ns-bpm"
                                type="number"
                                min={40}
                                max={300}
                                value={bpm}
                                onChange={e => setBpm(Number(e.target.value))}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="ns-escala">Escala (Opcional)</label>
                            <input
                                id="ns-escala"
                                type="text"
                                placeholder="Ex: Am, C# Major"
                                value={escala}
                                onChange={e => setEscala(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="ns-descricao">Descrição</label>
                            <textarea
                                id="ns-descricao"
                                className="modal-textarea"
                                value={descricao}
                                rows={2}
                                placeholder="Conte mais sobre a vibe do projeto..."
                                onChange={e => setDescricao(e.target.value)}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setCurrentStep('edit')}
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                className="btn-confirm"
                                disabled={loading}
                            >
                                {loading ? 'Publicando...' : 'Publicar Projeto'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export { NovoStudio };
