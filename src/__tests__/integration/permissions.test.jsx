import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import Private from '../../Private';

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: () => false,
    isPlatformAdmin: false,
  }),
}));

describe('route permissions', () => {
  beforeEach(() => {
    localStorage.setItem('adminToken', 'test-token');
  });

  afterEach(() => {
    localStorage.removeItem('adminToken');
  });

  it('redirects unauthorized users away from /users', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/users']}>
        <Private />
      </MemoryRouter>
    );
    expect(container.innerHTML).not.toContain('Invite');
  });
});
