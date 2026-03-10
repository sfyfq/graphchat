# Request: Fix Branch Counting Logic

The "Session Stats" panel currently shows an incorrect number of branches (e.g., 1 instead of 3). This is because it only counts nodes with an explicit `branchLabel`.

## Requirements:
- Redefine "Branches" to reflect the actual number of active conversation paths in the graph.
- A branch should be defined as a **leaf node** (a node that has no outgoing edges/children).
- Ensure the logic works correctly for branched graphs where some paths are longer than others.
