// src/services/healthScore.service.ts

import { prisma } from '@/utils/db';
import { calculateOverallHealthScore } from '@/utils/metrics';
import { Decimal } from 'decimal.js';

export class HealthScoreService {
  /**
   * Fetches the current (most recent) health score snapshot.
   */
  async getCurrentHealthScore(teamId: number) {
    return await prisma.health_score_snapshots.findFirst({
      where: { team_id: BigInt(teamId) },
      orderBy: { snapshot_date: 'desc' }
    });
  }

  /**
   * Fetches the health score trend over a period (default 30 days).
   */
  async getHealthScoreHistory(teamId: number, days: number = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    return await prisma.health_score_snapshots.findMany({
      where: {
        team_id: BigInt(teamId),
        snapshot_date: { gte: fromDate }
      },
      orderBy: { snapshot_date: 'asc' }
    });
  }

  /**
   * Calculates and stores a new health score snapshot based on team activity.
   */
  async calculateHealthScore(teamId: number) {
    // 1. Productivity: % of team with activity in last 7 days
    const usersCount = await prisma.users.count({
      where: { team_id: BigInt(teamId), is_active: true }
    });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await prisma.work_signals.groupBy({
      by: ['user_id'],
      where: {
        team_id: BigInt(teamId),
        timestamp: { gte: sevenDaysAgo }
      }
    });
    
    const productivity = (activeUsers.length / Math.max(usersCount, 1)) * 100;
    
    // 2. Collaboration: (cross-project messages / total messages) * 100
    const allSignals = await prisma.work_signals.findMany({
      where: {
        team_id: BigInt(teamId),
        source: 'slack',
        timestamp: { gte: sevenDaysAgo }
      }
    });
    
    const multiProjectSignals = allSignals.filter(s => s.project_id);
    const collaboration = (multiProjectSignals.length / Math.max(allSignals.length, 1)) * 100;
    
    // 3. Velocity: (completed tasks / planned tasks) * 100
    const projects = await prisma.projects.findMany({
      where: { team_id: BigInt(teamId) }
    });
    
    const completed = projects.filter(p => p.status === 'completed');
    const velocity = (completed.length / Math.max(projects.length, 1)) * 100;
    
    // Overall Score
    const overallScore = calculateOverallHealthScore({
      productivity,
      collaboration,
      velocity
    });
    
    // Store snapshot
    return await prisma.health_score_snapshots.create({
      data: {
        team_id: BigInt(teamId),
        productivity_score: new Decimal(productivity),
        collaboration_score: new Decimal(collaboration),
        velocity_score: new Decimal(velocity),
        overall_score: new Decimal(overallScore),
        snapshot_date: new Date()
      }
    });
  }
}

export const healthScoreService = new HealthScoreService();
