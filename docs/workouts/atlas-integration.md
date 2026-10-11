# Workout atlas integration

## What is in the repository?
- 38 bilingual exercise records in `apps/web/src/shared/lib/workout-atlas.ts`.
- 76 SVG phase diagrams derived from the **user-provided exercise atlas**, saved as `public/workout-atlas/NN_1.svg` and `NN_2.svg`.
- Three starting plans in `workout-cycle.ts`, based on the supplied new three-day split. They are templates, not medical prescriptions and do not contain private historical weights.
- Four Workout tabs: cycle, atlas, journal, progress.
- New authenticated endpoints `/api/v1/workout-atlas/install`, `/api/v1/workout-atlas/history/import`, `/api/v1/workout-atlas/history`.

## Import the private training journal
1. Sign into your own LifeOS account.
2. Open **Workout → Журнал → Выбрать .md файл**.
3. Select the original `training_history.md` file from the attached atlas or upload.
4. Review the extracted number of rows and confirm import.
5. Historical records are grouped by date. On repeated import the importer skips already-present source dates.

The app parses exact raw comments and separately extracts the source's bullet points for the private training profile. **The personal file is not part of the GitHub repository.**

## Data correctness
- Uploaded numbers may describe assisted reps, approximate loads, a best from long ago, split sets or missing workouts; imported records are stored as text annotations, not generated completed sets.
- PR/progress calculations use only completed real sets recorded in LifeOS.
- Values from different machine models are not interchangeable.
- Diagrams are deliberately schematic; they are not precise form instructions.
- Persistent or aggravated shoulder or wrist pain warrants clinical advice instead of automatic load progression.

## Release checklist
- [ ] GitHub Actions web/API tests, typecheck and build pass
- [ ] Staging PostgreSQL: install twice and verify no duplicated atlas exercises/plans
- [ ] Staging: import the journal twice and verify exact source records are preserved and deduped
- [ ] Staging: verify another user/workspace cannot access imported profile/history
- [ ] Mobile/tablet/desktop: inspect both phases of each exercise, active session, technique and completed summary
- [ ] Verify working weights aren't silently populated from ambiguous historic notes

## Branch relationship
This update builds on **PR #1**, the security and editorial design foundation.
Do not merge the workout branch before its security base, and do not push private workout history into the public repository.
