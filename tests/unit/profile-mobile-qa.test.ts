import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function load(filePath: string): string {
  return readFileSync(path.resolve(filePath), 'utf8');
}

describe('Mobile QA guardrails for profile responsiveness', () => {
  it('prevents horizontal scroll anti-pattern in tab nav', () => {
    const content = load('components/student/profile/profile-tab-nav.tsx');
    expect(content).not.toContain('overflow-x-auto scrollbar-none');
    expect(content).toContain('grid grid-cols-4');
  });

  it('removes fixed right margin anti-pattern in edit forms', () => {
    const projects = load('components/student/profile/tab-projects.tsx');
    const docs = load('components/student/profile/tab-docs.tsx');

    expect(projects).not.toContain('mr-8');
    expect(docs).not.toContain('mr-8');
  });

  it('keeps student pages free from local bottom-nav overlap paddings', () => {
    const profileView = load('app/(student)/student/profile/profile-view.tsx');
    const drives = load('app/(student)/student/drives/page.tsx');
    const leaderboard = load('app/(student)/student/leaderboard/page.tsx');

    expect(profileView).not.toMatch(/pb-24|pb-32/);
    expect(drives).not.toMatch(/pb-24|pb-32/);
    expect(leaderboard).not.toMatch(/pb-24|pb-32/);
  });

  it('retains explicit safe-area support', () => {
    const rootLayout = load('app/layout.tsx');
    const shellLayout = load('app/(student)/layout.tsx');

    expect(rootLayout).toContain("viewportFit: 'cover'");
    expect(shellLayout).toContain('safe-area-inset-bottom');
  });
});
