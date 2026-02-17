# Implementation Plan: Renaming Media Tools & Scripts

## Phase 1: Preparation & Tracking (Completed)
- [x] Create track and document plan.
- [x] Identify all references to `media-mapper.js` and `media-visualizer.js`.

## Phase 2: Script Renaming (Completed)
- [x] Rename `factory/cli/media-mapper.js` to `factory/cli/media-mapper-cli.js`.
- [x] Rename `factory/5-engine/media-visualizer.js` to `factory/5-engine/media-mapper.js`.

## Phase 3: Codebase Updates (Completed)
- [x] Update imports and execution calls in `factory/5-engine/controllers/ServerController.js`.
- [x] Update `factory/cli/athena-cli.js` references.
- [x] Update documentation (`QUICK_START.md`) and file headers.

## Phase 4: UI & Terminology Updates (Completed)
- [x] Update `factory/dashboard/public/index.html` titles and labels.
- [x] Update `factory/dashboard/public/app.js` (TOOL_INFO, modal titles, descriptions).
- [x] Enhance "Site AI Image Prompt Generator" description.

## Phase 5: Verification (Ready for Testing)
- [ ] Test Site Media Mapper (Visual) from Dashboard.
- [ ] Test Site Media Mapper (CLI) from terminal.
- [ ] Verify all tooltips and info boxes.
