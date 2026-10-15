import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  MAX_UPLOAD_BYTES,
  UploadTooLargeError,
  assertUploadSize,
  checkUploadSize,
  uploadAudioFile,
} from '@/utility/uploadAudio'

/** File com tamanho declarado, sem alocar os bytes de verdade. */
function fakeFile(size: number, name = 'take.mp3'): File {
  const file = new File(['x'], name, { type: 'audio/mpeg' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

const mockFetch = vi.fn()

describe('uploadAudio', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('checkUploadSize aceita arquivo no limite exato', () => {
    expect(checkUploadSize(fakeFile(MAX_UPLOAD_BYTES))).toBeNull()
  })

  it('checkUploadSize recusa arquivo acima do limite com mensagem em MB', () => {
    const msg = checkUploadSize(fakeFile(52 * 1024 * 1024))
    expect(msg).toContain('52MB')
    expect(msg).toContain('40MB')
  })

  it('assertUploadSize lança UploadTooLargeError', () => {
    expect(() => assertUploadSize(fakeFile(MAX_UPLOAD_BYTES + 1))).toThrow(UploadTooLargeError)
  })

  it('uploadAudioFile não faz requisição quando o arquivo passa do limite', async () => {
    await expect(uploadAudioFile(fakeFile(MAX_UPLOAD_BYTES + 1))).rejects.toThrow(/muito grande/)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('uploadAudioFile envia e devolve a URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ fileUrl: 'https://cdn/audio.mp3' }),
    })

    const url = await uploadAudioFile(fakeFile(1024))

    expect(url).toBe('https://cdn/audio.mp3')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/upload'),
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
  })

  it('uploadAudioFile repassa a mensagem do 413 do servidor', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 413,
      json: () => Promise.resolve({ mensagem: 'Arquivo muito grande. O máximo é 40MB.' }),
    })

    await expect(uploadAudioFile(fakeFile(1024))).rejects.toThrow('O máximo é 40MB')
  })
})
