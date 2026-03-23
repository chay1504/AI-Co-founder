// src/services/blocker.service.ts

import { prisma } from '@/utils/db';
import { BlockerSeverity } from '@/types';

export class BlockerService {
  /**
   * Creates a new blocker.
   */
  async createBlocker(data: { team_id: number; project_id: number; title: string; description?: string; severity: BlockerSeverity; owner_id?: number }) {
    return await prisma.blockers.create({
      data: {
        team_id: BigInt(data.team_id),
        project_id: BigInt(data.project_id),
        title: data.title,
        description: data.description,
        severity: data.severity,
        owner_id: data.owner_id ? BigInt(data.owner_id) : undefined,
        status: 'open',
        days_stalled: 0
      }
    });
  }

  /**
   * Fetches a blocker by ID.
   */
  async getBlockerById(id: number) {
    return await prisma.blockers.findUnique({
      where: { id: BigInt(id) },
      include: { project: true, owner: true }
    });
  }

  /**
   * Updates a blocker's details or status.
   */
  async updateBlocker(id: number, data: Partial<{ title: string; description: string; severity: BlockerSeverity; status: string; days_stalled: number }>) {
    return await prisma.blockers.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.severity && { severity: data.severity }),
        ...(data.status && { status: data.status }),
        ...(data.days_stalled !== undefined && { days_stalled: data.days_stalled })
      }
    });
  }

  /**
   * Resolves or deletes a blocker.
   */
  async resolveBlocker(id: number) {
    return await prisma.blockers.update({
      where: { id: BigInt(id) },
      data: { status: 'resolved' }
    });
  }

  /**
   * Fetches all blockers for a team.
   */
  async getBlockersByTeam(teamId: number) {
    return await prisma.blockers.findMany({
      where: { team_id: BigInt(teamId) },
      include: { project: true, owner: true }
    });
  }

  /**
   * Fetches active blockers for a team.
   */
  async getActiveBlockersByTeam(teamId: number) {
    return await prisma.blockers.findMany({
      where: { team_id: BigInt(teamId), status: { not: 'resolved' } },
      include: { project: true, owner: true }
    });
  }
}

export const blockerService = new BlockerService();
