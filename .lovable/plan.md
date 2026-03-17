

## Analysis

**The Bug:** When Play is clicked, `setCurrentIdx(0)` resets to the oldest snapshot. At index 0, `prevSnap` is `null`, so `stats.biggestChange` is `null`. The right column is conditionally rendered with `{!isMobile && stats?.biggestChange && (...)}` — when biggestChange is null, the entire right column unmounts, causing the radar chart to reflow and shift. When playback advances to index 1+, the column reappears, causing the jump.

**The Layout Fix:** Always render both side columns regardless of data state. When `biggestChange` is null, show a fallback (e.g., just the Month Average box, or a "No prior month" placeholder for Biggest Change).

**The Radar Size Increase:** Currently the radar container is `h-[330px]` on desktop. 50% bigger = ~495px. To fit within the same card height, the controls section and title need to be further compressed. The side stat columns should use absolute/overlay positioning or be placed inside the radar area to avoid adding height.

## Plan

### 1. Fix the conditional column rendering bug
In `SnapshotPlayback.tsx`, change the right column from `{!isMobile && stats?.biggestChange && (...)}` to `{!isMobile && stats && (...)}`. Inside, conditionally show the Biggest Change card only when `biggestChange` exists, otherwise show a placeholder or just the Month Average. This keeps the column always mounted so the layout never shifts.

### 2. Enlarge the radar chart
- Increase the radar container from `h-[330px]` to `h-[420px]` on desktop (keeping mobile proportional).
- Increase `outerRadius` from `76%` to `82%` so the actual chart polygon fills more of the container.

### 3. Compress everything else to maintain card height
- Remove the title/subtitle top margin, make text smaller (`text-base` instead of `text-lg sm:text-xl`).
- Reduce playback controls section: collapse timeline dots, controls row, and month label into a tighter single block with `space-y-0.5`.
- Reduce the "You are here" badge margin.
- Reduce card padding from `p-3 sm:p-4 lg:p-5` to `p-2 sm:p-3 lg:p-4`.

### 4. Keep side columns vertically centered
Change the side columns from `pt-12` to use `justify-center` so they stay centered relative to the larger radar, preventing awkward top-alignment.

