**Your Optimized Prompt:**
Initialize a git repository for the current project. Create the `main` branch and then branch off to create `dev`. Add all untracked files and commit them to the `dev` branch. Ensure that no commits are ever made directly to `main` and that the `main` branch is only updated via user-initiated merges.

**Key Improvements:**
- Explicitly states the requirement for `main` and `dev` branches.
- Sets a clear boundary: commits are allowed on `dev` but strictly forbidden on `main`.
- Recognizes that `main` updates are manual actions for the user.

**Techniques Applied:** Task decomposition and constraint enforcement.
