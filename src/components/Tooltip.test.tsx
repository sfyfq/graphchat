import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip } from './Tooltip'
import type { Commit } from '../types'
import React from 'react'

describe('Tooltip Component', () => {
  const mockCommit: Commit = {
    id: 'test-id',
    parentId: null,
    role: 'user',
    content: 'This is a test message that is quite long to test truncation if summary is missing.',
    summary: 'Test summary',
    timestamp: Date.now(),
    model: 'test-model',
  }

  it('renders correctly with summary and no branch label', () => {
    render(<Tooltip commit={mockCommit} screenX={100} screenY={200} />)

    expect(screen.getByText(/user/i)).toBeInTheDocument()
    expect(screen.getByText('Test summary')).toBeInTheDocument()
    expect(screen.queryByText('Branch 1')).not.toBeInTheDocument()
  })

  it('renders branch label when provided', () => {
    const commitWithBranch: Commit = {
      ...mockCommit,
      branchLabel: 'Branch 1'
    }
    render(<Tooltip commit={commitWithBranch} screenX={100} screenY={200} />)

    expect(screen.getByText('Branch 1')).toBeInTheDocument()
  })

  it('uses content if summary is missing', () => {
    const commitNoSummary: Commit = {
      ...mockCommit,
      summary: ''
    }
    render(<Tooltip commit={commitNoSummary} screenX={100} screenY={200} />)

    // Should show truncated content
    expect(screen.getByText(/This is a test message/)).toBeInTheDocument()
  })
})
