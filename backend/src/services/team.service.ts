// src/services/team.service.ts

import { prisma } from '@/utils/db';
import { Team, User } from '@/types';

export class TeamService {
  /**
   * Creates a new team with basic settings.
   */
  async createTeam(data: { name: string; slug: string; company_id: string }) {
    return await prisma.teams.create({
      data: {
        name: data.name,
        slug: data.slug,
        company_id: data.company_id,
        is_active: true
      }
    });
  }

  /**
   * Fetches a team by ID.
   */
  async getTeamById(id: number) {
    return await prisma.teams.findUnique({
      where: { id: BigInt(id) }
    });
  }

  /**
   * Updates a team by ID.
   */
  async updateTeam(id: number, data: Partial<Team>) {
    return await prisma.teams.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.company_id && { company_id: data.company_id }),
      }
    });
  }

  /**
   * Fetches all users belonging to a team.
   */
  async getTeamMembers(teamId: number) {
    return await prisma.users.findMany({
      where: { team_id: BigInt(teamId), is_active: true }
    });
  }
}

export const teamService = new TeamService();
