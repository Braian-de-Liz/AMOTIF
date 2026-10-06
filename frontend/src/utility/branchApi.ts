import { URL_API_TESTE } from './url_apis';
import type { LayerBranch } from '../types/project';

export async function fetchBranches(layerId: string): Promise<LayerBranch[]> {
    const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/branches`, { credentials: 'include' });
    if (!res.ok) throw new Error('Erro ao buscar branches');
    const data = await res.json();
    return data.branches || [];
}

export async function createBranch(layerId: string, nome: string, baseVersionId: string): Promise<LayerBranch> {
    const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nome, baseVersionId })
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.mensagem || 'Erro ao criar branch');
    }
    const data = await res.json();
    return data.branch;
}

export async function switchBranch(layerId: string, branchId: string): Promise<{ versao: { id: string; versionNumber: number } }> {
    const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/switch-branch/${branchId}`, {
        method: 'PATCH',
        credentials: 'include'
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.mensagem || 'Erro ao trocar branch');
    }
    return res.json();
}

export async function mergeBranch(layerId: string, branchId: string, mensagem?: string): Promise<{ versao: { id: string; versionNumber: number } }> {
    const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/branches/${branchId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mensagem })
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.mensagem || 'Erro ao fazer merge');
    }
    return res.json();
}

export async function deleteBranch(layerId: string, branchId: string): Promise<void> {
    const res = await fetch(`${URL_API_TESTE}/layer/${layerId}/branches/${branchId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.mensagem || 'Erro ao excluir branch');
    }
}