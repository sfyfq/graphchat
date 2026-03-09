export type Role = 'user' | 'assistant'

export interface Commit {
  id:           string
  parentId:     string | null
  role:         Role
  content:      string
  summary:      string
  branchLabel?: string
  timestamp:    number
  model:        string
}

export interface Edge {
  source: string
  target: string
}

export interface NodePosition {
  x: number
  y: number
}

export interface Layout {
  [commitId: string]: NodePosition
}

export interface DialogState {
  commitId: string
  x: number
  y: number
}

export interface CanvasTransform {
  x: number
  y: number
  zoom: number
}
