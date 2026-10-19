import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Modal } from '@/components/Modal'

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>abrir</button>
      <Modal
        isOpen={open}
        onClose={() => {
          onClose()
          setOpen(false)
        }}
        title="Título"
        titleId="t"
      >
        <button>primeiro</button>
        <button>último</button>
      </Modal>
    </>
  )
}

describe('Modal - foco', () => {
  it('move o foco para dentro ao abrir', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('abrir'))
    expect(screen.getByText('primeiro')).toHaveFocus()
  })

  it('mantém o Tab dentro do diálogo nos dois sentidos', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('abrir'))

    await user.tab()
    expect(screen.getByText('último')).toHaveFocus()
    await user.tab()
    expect(screen.getByText('primeiro')).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByText('último')).toHaveFocus()
  })

  it('fecha com Esc e devolve o foco ao botão que abriu', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const trigger = screen.getByText('abrir')
    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
