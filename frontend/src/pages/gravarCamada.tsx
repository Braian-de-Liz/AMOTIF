import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, Scissors, Send, Check, Music } from 'lucide-react';
import { AudioRecorder } from '../components/AudioRecorder';
import { AudioEditor } from '../components/AudioEditor';
import { URL_API_TESTE } from '../utility/url_apis';
import { uploadAudioFile } from '../utility/uploadAudio';
import { createLayerSchema } from '../schemas/createLayerSchema';
import { formatZodErrors } from '../utility/validationHelpers';
import { SEOHead } from '../components/SEOHead';
import '../styles/NovoStudio.css';

type Step = 'record' | 'edit' | 'publish';

function GravarCamada() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<Step>('record');
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedDuration, setRecordedDuration] = useState(0);
    const [editedBlob, setEditedBlob] = useState<Blob | null>(null);

    const [nomeTrilha, setNomeTrilha] = useState('');
    const [instrumentoTag, setInstrumentoTag] = useState('');
    const [tag, setTag] = useState('');
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

    const voltarAoStudio = () => navigate(`/studio/${id}`);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!editedBlob) {
            setSubmitError('Nenhum áudio para enviar.');
            return;
        }

        const validate = createLayerSchema.safeParse({
            nome_trilha: nomeTrilha,
            instrumento_tag: instrumentoTag,
            tag: tag || undefined,
        });
        if (!validate.success) {
            setSubmitError(formatZodErrors(validate.error));
            return;
        }

        setLoading(true);
        try {
            const ext = editedBlob.type.includes('wav') ? '.wav' : '.webm';
            const file = new File([editedBlob], `camada_${Date.now()}${ext}`, { type: editedBlob.type });
            const fileUrl = await uploadAudioFile(file);

            const response = await fetch(`${URL_API_TESTE}/layer/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    nome_trilha: nomeTrilha,
                    audio_url: fileUrl,
                    instrumento_tag: instrumentoTag,
                    tag: tag || undefined,
                }),
            });

            if (response.ok) {
                voltarAoStudio();
            } else {
                const data = await response.json().catch(() => ({}));
                setSubmitError(data.mensagem || 'Erro ao criar camada.');
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
        { key: 'publish', label: 'Enviar', icon: <Send size={16} /> },
    ];
    const stepIndex = steps.findIndex(s => s.key === currentStep);

    return (
        <div className="novo-studio-page">
            <SEOHead
                title="Gravar Camada"
                description="Grave, edite e envie uma nova camada para o projeto."
                url={`/studio/${id}/gravar`}
            />

            <header className="user-header">
                <h1>Gravar Camada</h1>
                <p>Grave, edite e envie uma nova camada para o projeto</p>
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
                    <div className="step-actions">
                        <button type="button" className="btn-cancel" onClick={voltarAoStudio}>
                            Cancelar
                        </button>
                        {recordedBlob && (
                            <button className="btn-confirm" onClick={() => setCurrentStep('edit')}>
                                <Scissors size={16} />
                                Prosseguir para Edição
                            </button>
                        )}
                    </div>
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

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="gc-nome">Nome da Trilha</label>
                            <input
                                id="gc-nome"
                                type="text"
                                required
                                placeholder="Ex: Baixo Elétrico"
                                value={nomeTrilha}
                                onChange={e => setNomeTrilha(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="gc-instrumento">Instrumento</label>
                            <input
                                id="gc-instrumento"
                                type="text"
                                required
                                placeholder="Ex: Baixo, Guitarra, Bateria..."
                                value={instrumentoTag}
                                onChange={e => setInstrumentoTag(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="gc-tag">Tag da versão (opcional)</label>
                            <input
                                id="gc-tag"
                                type="text"
                                maxLength={50}
                                placeholder="Ex: take-3, pré-master"
                                value={tag}
                                onChange={e => setTag(e.target.value)}
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setCurrentStep('edit')} disabled={loading}>
                                Voltar
                            </button>
                            <button type="submit" className="btn-confirm" disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar Camada'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export { GravarCamada };
