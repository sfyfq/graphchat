/**
 * Format a timestamp as relative time (e.g. "2m ago").
 */
export function timeAgo(ts: number): string {
  const d = Date.now() - ts
  if (d < 60_000)        return 'just now'
  if (d < 3_600_000)     return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000)    return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

/**
 * Truncate a string to at most n characters, appending ellipsis.
 */
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

/**
 * Detect if the cursor is within $...$ or $$...$$ delimiters and return the math string.
 */
export function getMathAtCursor(text: string, pos: number): string | null {
  if (!text) return null;

  // Check for $$...$$ block math first
  const blockRegex = /\$\$(.*?)\$\$/gs;
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    const start = match.index;
    const end = blockRegex.lastIndex;
    if (pos >= start && pos <= end) {
      return match[0];
    }
  }

  // Check for $...$ inline math
  const inlineRegex = /\$((?!\$)[^\$]+?)\$/g;
  while ((match = inlineRegex.exec(text)) !== null) {
    const start = match.index;
    const end = inlineRegex.lastIndex;
    if (pos >= start && pos <= end) {
      return match[0];
    }
  }

  return null;
}

/**
 * Generate a short summary from message content.
 */
export function makeSummary(content: string): string {
  return truncate(content.replace(/\n+/g, ' ').trim(), 72)
}

/**
 * Assign a stable color to a branch label.
 */
const BRANCH_COLORS: Record<string, string> = {}
const COLOR_PALETTE = [
  '#4ade80', // green  — main
  '#a78bfa', // violet
  '#60a5fa', // blue
  '#f472b6', // pink
  '#fb923c', // orange
  '#34d399', // emerald
  '#f59e0b', // amber
]
let colorIndex = 1 // 0 reserved for main

export function branchColor(label: string | undefined): string {
  if (!label) return 'rgba(255,255,255,0.2)'
  if (label === 'main') return COLOR_PALETTE[0]
  if (!BRANCH_COLORS[label]) {
    BRANCH_COLORS[label] = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
    colorIndex++
  }
  return BRANCH_COLORS[label]
}

/**
 * Clamp a value between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}
