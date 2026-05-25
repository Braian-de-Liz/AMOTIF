export interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface ChildrenProps {
  children: React.ReactNode
}

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>
