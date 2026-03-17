import type { Snapshot, SnapshotCategory } from '@/types';

/**
 * Build a rich, structured context string from snapshot history
 * that the AI can use to provide personalized guidance.
 */
export function buildSnapshotProfileContext(
  snapshots: Snapshot[],
  categories: SnapshotCategory[],
  userName: string,
  chapter?: string,
  role?: string
): string {
  if (!snapshots.length) return `[No snapshot data available for ${userName}]`;

  const catMap = new Map(categories.map(c => [c.id, c]));
  const latest = snapshots[0];
  const previous = snapshots[1];
  const oldest = snapshots[snapshots.length - 1];

  const lines: string[] = [];

  // ─── Identity ───
  lines.push(`== MEMBER PROFILE ==`);
  lines.push(`Name: ${userName}`);
  if (role) lines.push(`Role: ${role}`);
  if (chapter) lines.push(`Chapter: ${chapter}`);
  lines.push(`Snapshot history: ${snapshots.length} months (${oldest.date} → ${latest.date})`);

  // ─── Purpose & Goals ───
  lines.push(`\n== PURPOSE & GOALS ==`);
  lines.push(`Purpose Statement: "${latest.purposeStatement}"`);
  lines.push(`Current Quarterly Goal: "${latest.quarterlyGoal}"`);
  lines.push(`Major Issue: "${latest.majorIssue}"`);

  // ─── Current Scores ───
  lines.push(`\n== CURRENT SCORES (${latest.date}) ==`);
  const scores = latest.ratings.map(r => {
    const cat = catMap.get(r.categoryId);
    const name = cat?.name || r.categoryId;
    let entry = `${name}: ${r.score}/10`;
    if (r.spouseScore !== undefined) entry += ` (spouse: ${r.spouseScore}/10)`;
    if (r.childScore !== undefined) entry += ` (child: ${r.childScore}/10)`;
    if (r.note) entry += ` — note: "${r.note}"`;
    if (r.lifeEvent) entry += ` — life event: "${r.lifeEvent}"`;
    return entry;
  });
  lines.push(scores.join('\n'));

  const avg = (latest.ratings.reduce((s, r) => s + r.score, 0) / latest.ratings.length).toFixed(1);
  lines.push(`Overall Average: ${avg}/10`);

  // ─── Perception Gaps ───
  const gaps = latest.ratings.filter(r => {
    if (r.spouseScore !== undefined) return Math.abs(r.score - r.spouseScore) >= 3;
    if (r.childScore !== undefined) return Math.abs(r.score - r.childScore) >= 3;
    return false;
  });
  if (gaps.length) {
    lines.push(`\n== PERCEPTION GAPS (≥3 point difference) ==`);
    gaps.forEach(r => {
      const name = catMap.get(r.categoryId)?.name || r.categoryId;
      if (r.spouseScore !== undefined) {
        lines.push(`${name}: Self ${r.score} vs Spouse ${r.spouseScore} (gap: ${r.score - r.spouseScore})`);
      }
      if (r.childScore !== undefined) {
        lines.push(`${name}: Self ${r.score} vs Child ${r.childScore} (gap: ${r.score - r.childScore})`);
      }
    });
  }

  // ─── Trends (month-over-month) ───
  if (previous) {
    lines.push(`\n== MONTH-OVER-MONTH CHANGES ==`);
    latest.ratings.forEach(r => {
      const prevR = previous.ratings.find(p => p.categoryId === r.categoryId);
      if (prevR) {
        const delta = r.score - prevR.score;
        if (delta !== 0) {
          const name = catMap.get(r.categoryId)?.name || r.categoryId;
          const arrow = delta > 0 ? '↑' : '↓';
          lines.push(`${name}: ${prevR.score} → ${r.score} (${arrow}${Math.abs(delta)})`);
        }
      }
    });
  }

  // ─── 6-month trend for each category ───
  if (snapshots.length >= 3) {
    lines.push(`\n== 6-MONTH TREND (newest → oldest) ==`);
    const catIds = latest.ratings.map(r => r.categoryId);
    catIds.forEach(catId => {
      const name = catMap.get(catId)?.name || catId;
      const history = snapshots.slice(0, Math.min(6, snapshots.length)).map(s => {
        const r = s.ratings.find(r => r.categoryId === catId);
        return r ? r.score : '-';
      });
      lines.push(`${name}: [${history.join(', ')}]`);
    });
  }

  // ─── Highlights ───
  const low = latest.ratings.filter(r => r.score <= 4);
  const high = latest.ratings.filter(r => r.score >= 8);
  const bigDeclines = previous ? latest.ratings.filter(r => {
    const p = previous.ratings.find(pr => pr.categoryId === r.categoryId);
    return p && (r.score - p.score) <= -2;
  }) : [];

  if (low.length || high.length || bigDeclines.length) {
    lines.push(`\n== KEY HIGHLIGHTS ==`);
    if (high.length) {
      lines.push(`Strengths (≥8): ${high.map(r => catMap.get(r.categoryId)?.name || r.categoryId).join(', ')}`);
    }
    if (low.length) {
      lines.push(`Concern Areas (≤4): ${low.map(r => `${catMap.get(r.categoryId)?.name || r.categoryId} (${r.score})`).join(', ')}`);
    }
    if (bigDeclines.length) {
      lines.push(`Significant Declines (≥2 pts): ${bigDeclines.map(r => {
        const p = previous!.ratings.find(pr => pr.categoryId === r.categoryId);
        return `${catMap.get(r.categoryId)?.name || r.categoryId} (${p!.score}→${r.score})`;
      }).join(', ')}`);
    }
  }

  // ─── Historical Goals & Issues ───
  if (snapshots.length > 1) {
    lines.push(`\n== RECENT GOALS & ISSUES ==`);
    snapshots.slice(0, 4).forEach(s => {
      lines.push(`${s.date}: Goal: "${s.quarterlyGoal}" | Issue: "${s.majorIssue}"`);
    });
  }

  return lines.join('\n');
}
