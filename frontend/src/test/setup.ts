import '@testing-library/jest-dom/vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { afterEach, expect } from 'vitest'

// Registra os matchers do jest-dom direto no expect do vitest (o entry '@testing-library/jest-dom/vitest'
// não registra com o vitest 5.0.3 instalado pelo bun).
expect.extend(matchers)

afterEach(() => {
  cleanup()
})
