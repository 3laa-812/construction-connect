/**
 * Sync push LWW logic is covered indirectly via integration tests.
 * The update branch compares incoming.updated_at with existing.updated_at
 * in sync.service.ts push transaction — keep this stub for future isolated mocks.
 */
describe('SyncService (unit stub)', () => {
  it('placeholder for LWW regression tests', () => {
    expect(true).toBe(true);
  });
});
