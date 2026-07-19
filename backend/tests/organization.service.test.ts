// Mock the Prisma singleton before importing the service under test.
jest.mock('@/config/db', () => ({
  prisma: {
    employee: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/config/db';
import { wouldCreateCycle } from '@/services/organization.service';

type ManagerChain = Record<string, string | null>;

/**
 * Builds a fake reporting chain map (employeeId -> managerId) and wires
 * prisma.employee.findUnique to resolve from it.
 */
function mockChain(chain: ManagerChain) {
  (prisma.employee.findUnique as jest.Mock).mockImplementation(({ where }: { where: { id: string } }) => {
    if (!(where.id in chain)) return Promise.resolve(null);
    return Promise.resolve({ managerId: chain[where.id] });
  });
}

describe('wouldCreateCycle', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns false for a simple valid assignment (no cycle)', async () => {
    // A -> B -> C (C reports to B, B reports to A)
    mockChain({ B: 'A', A: null });
    const result = await wouldCreateCycle('C', 'B');
    expect(result).toBe(false);
  });

  it('detects a direct cycle (A tries to report to its own direct report)', async () => {
    // A -> B (B reports to A). Now trying to make A report to B => cycle.
    mockChain({ B: 'A' });
    const result = await wouldCreateCycle('A', 'B');
    expect(result).toBe(true);
  });

  it('detects an indirect/multi-level cycle', async () => {
    // Chain: B -> A, C -> B (so C's manager chain is C -> B -> A).
    // Attempting to set A's manager to C would create a cycle: A -> C -> B -> A.
    mockChain({ B: 'A', C: 'B' });
    const result = await wouldCreateCycle('A', 'C');
    expect(result).toBe(true);
  });

  it('returns false when the new manager has no manager chain at all', async () => {
    mockChain({ TopBoss: null });
    const result = await wouldCreateCycle('SomeEmployee', 'TopBoss');
    expect(result).toBe(false);
  });
});
