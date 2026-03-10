export type Role = 'user' | 'assistant'

export interface Attachment {
  id:   string // hash or unique identifier
  name: string
  type: string // mime type
  size: number
}

export interface Commit {
  id:           string
  parentId:     string | null
  role:         Role
  content:      string
  summary:      string
  branchLabel?: string
  timestamp:    number
  model:        string
  attachments?: Attachment[]
}

export interface ChatSession {
  id:           string
  name:         string
  commits:      Record<string, Commit>
  edges:        Edge[]
  HEAD:         string
  lastModified: number
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
  x: number;
  y: number;
  initialInput?: string;
}

export interface CanvasTransform {
  x: number
  y: number
  zoom: number
}
