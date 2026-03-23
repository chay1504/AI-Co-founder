// src/services/user.service.ts

import { prisma } from '@/utils/db';
import { UserRole } from '@/types';

export class UserService {
  /**
   * Adds a new user to a team.
   */
  async createUser(data: { team_id: number; email: string; full_name?: string; role?: UserRole }) {
    return await prisma.users.create({
      data: {
        team_id: BigInt(data.team_id),
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_active: true
      }
    });
  }

  /**
   * Fetches a user by ID.
   */
  async getUserById(id: number) {
    return await prisma.users.findUnique({
      where: { id: BigInt(id) }
    });
  }

  /**
   * Updates a user's details.
   */
  async updateUser(id: number, data: Partial<{ full_name: string; role: UserRole; slack_user_id: string; github_username: string }>) {
    return await prisma.users.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.full_name && { full_name: data.full_name }),
        ...(data.role && { role: data.role }),
        ...(data.slack_user_id && { slack_user_id: data.slack_user_id }),
        ...(data.github_username && { github_username: data.github_username }),
      }
    });
  }

  /**
   * Removes a user (soft delete by setting is_active=false).
   */
  async removeUser(id: number) {
    return await prisma.users.update({
      where: { id: BigInt(id) },
      data: { is_active: false }
    });
  }

  /**
   * Fetches all users belonging to a team.
   */
  async getUsersByTeam(teamId: number) {
    return await prisma.users.findMany({
      where: { team_id: BigInt(teamId), is_active: true }
    });
  }
}

export const userService = new UserService();
