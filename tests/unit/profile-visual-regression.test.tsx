import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import ProfileHeader from '@/components/student/profile/profile-header';
import ProfileTabNav from '@/components/student/profile/profile-tab-nav';

describe('Profile visual regression snapshots', () => {
  it('matches profile header view mode', () => {
    const { container } = render(
      <ProfileHeader
        name='Aniruddh Vijay Vargia'
        email='aniruddh.125613@stu.upes.ac.in'
        sapId='500125613'
        rollNo='R2142231769'
        batchYear={2027}
        branch='AIML'
        completeness={90}
        isEditing={false}
        isLoading={false}
        onEdit={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches profile header edit mode', () => {
    const { container } = render(
      <ProfileHeader
        name='Aniruddh Vijay Vargia'
        email='aniruddh.125613@stu.upes.ac.in'
        sapId='500125613'
        rollNo='R2142231769'
        batchYear={2027}
        branch='AIML'
        completeness={90}
        isEditing
        isLoading={false}
        onEdit={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches tab nav active states', () => {
    const { container, rerender } = render(<ProfileTabNav active='identity' onChange={vi.fn()} />);
    expect(container.firstChild).toMatchSnapshot();

    rerender(<ProfileTabNav active='documents' onChange={vi.fn()} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
