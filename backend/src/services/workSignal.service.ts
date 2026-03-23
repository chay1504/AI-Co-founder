// src/services/workSignal.service.ts

import { prisma } from '@/utils/db';

export class WorkSignalService {
  /**
   * Stores a new work signal from an integrated source.
   */
  async createSignal(data: { team_id: number; user_id: number; source: string; signal_type: string; project_id?: number; metadata?: any; timestamp?: Date }) {
    return await prisma.work_signals.create({
      data: {
        team_id: BigInt(data.team_id),
        user_id: BigInt(data.user_id),
        source: data.source,
        signal_type: data.signal_type,
        project_id: data.project_id ? BigInt(data.project_id) : undefined,
        metadata: data.metadata,
        timestamp: data.timestamp || new Date()
      }
    });
  }

  /**
   * Fetches work signals for a specific user.
   */
  async getSignalsByUser(userId: number) {
    return await prisma.work_signals.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { timestamp: 'desc' }
    });
  }

  /**
   * Fetches work signals for a specific project.
   */
  async getSignalsByProject(projectId: number) {
    return await prisma.work_signals.findMany({
      where: { project_id: BigInt(projectId) },
      orderBy: { timestamp: 'desc' }
    });
  }

  /**
   * Fetches work signals for a team with optional date range filter.
   */
  async getSignalsByTeam(teamId: number, from?: Date, to?: Date) {
    return await prisma.work_signals.findMany({
      where: {
        team_id: BigInt(teamId),
        timestamp: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }
}

export const workSignalService = new WorkSignalService();
