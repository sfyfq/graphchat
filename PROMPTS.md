# Bugfix: Topological Branch Counting

## Objective
Update the branch counting logic in `Toolbar.tsx` to count the number of "leaf nodes" (nodes without children) in the graph, accurately reflecting the number of unique conversation paths.

## Implementation Details
- Update `src/components/Toolbar/Toolbar.tsx`:
    - Inside the `stats` useMemo hook:
        - Identify all node IDs that act as a `source` in the `currentSession.edges` array.
        - Filter `currentSession.commits` to find nodes whose IDs are **not** in the set of source IDs.
        - The count of these "leaf" nodes is the true branch count.
