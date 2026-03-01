# Implementation Plan: Systematic Site Optimization (20260301)

## Phase 1: Preparation and Baseline Analysis
- [~] Task: Audit Sites Sequentially (Alphabetical Order)
      - [x] Start with Site #1: `athena-hub` (Full Audit - [x] Start with Site #1: `athena-hub` Stability Complete). Perform baseline Lighthouse audits and architectural review.
      - [ ] Record baseline scores and identified bottlenecks in `performance_report.md`.
      - [ ] Move through the list: `athena-pro`, `athena-promo`, etc.- [ ] Task: Audit Base Templates
    - [ ] Review `factory/2-templates/` for redundant JS/CSS and resource-intensive patterns.
    - [ ] Identify opportunities for script deferral and font optimization.

## Phase 2: Foundation Optimization (Base Templates)
- [ ] Task: Implement Font Optimization
    - [ ] Replace external font links with self-hosting or system font stacks in the base template.
    - [ ] Update generator logic to handle font assets locally if needed.
- [ ] Task: Optimize Script Loading
    - [ ] Implement defer/async/lazy-loading for third-party script injections in `factory/5-engine/logic/`.
    - [ ] Research and potentially integrate Partytown for off-main-thread script execution.
- [ ] Task: Clean Up CSS/Tailwind
    - [ ] Audit `index.css` and Tailwind configuration for unused features and large payloads.
    - [ ] Ensure critical CSS is prioritized and non-essential styles are deferred.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Foundation Optimization' (Protocol in workflow.md)

## Phase 3: Image and Media Optimization
- [ ] Task: Implement Responsive and Lazy-Loaded Images
    - [ ] Update image components in `factory/2-templates/components/` to use native `loading="lazy"` and `srcset` where applicable.
    - [ ] Ensure modern formats (WebP) are used by default.
- [ ] Task: Optimize Hero Sections for LCP
    - [ ] Implement preloading for hero images.
    - [ ] Optimize hero section layout to prevent CLS during image load.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Image and Media Optimization' (Protocol in workflow.md)

## Phase 4: Systematic Rollout and Validation
- [ ] Task: Regenerate and Update Sites
    - [ ] Use the factory engine to update all sites in the `sites/` directory with the new optimizations.
    - [ ] Verify build integrity for each site.
- [ ] Task: Final Validation Audit
    - [ ] Run post-optimization Lighthouse audits on the pilot sites.
    - [ ] Confirm all acceptance criteria from `spec.md` are met.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Systematic Rollout and Validation' (Protocol in workflow.md)