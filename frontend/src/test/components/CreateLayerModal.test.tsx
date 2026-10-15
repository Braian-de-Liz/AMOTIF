import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CreateLayerModal } from '@/components/CreateLayerModal'
import { MAX_UPLOAD_BYTES } from '@/utility/uploadAudio'

const mockFetch = vi.fn()

function fakeFile(size: number): File {
  const file = new File(['x'], 'grande.wav', { type: 'audio/wav' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('CreateLayerModal - limite de upload', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mostra erro ao escolher arquivo acima do limite e não envia nada', async () => {
    render(
      <CreateLayerModal projetoId="p1" isOpen onClose={() => {}} onLayerCreated={() => {}} />
    )

    // O Modal pode renderizar via portal, então a busca é no documento inteiro.
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [fakeFile(MAX_UPLOAD_BYTES + 5 * 1024 * 1024)] } })

    expect(await screen.findByText(/Arquivo muito grande/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar Camada/ })).toBeDisabled()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
