// src/services/project.service.ts

import { prisma } from '@/utils/db';
import { ProjectStatus } from '@/types';

export class ProjectService {
  /**
   * Creates a new project within a team.
   */
  async createProject(data: { team_id: number; name: string; description?: string; owner_id?: number; start_date?: Date; deadline?: Date }) {
    return await prisma.projects.create({
      data: {
        team_id: BigInt(data.team_id),
        name: data.name,
        description: data.description,
        owner_id: data.owner_id ? BigInt(data.owner_id) : undefined,
        start_date: data.start_date,
        deadline: data.deadline,
        status: 'planning', // Default status from roadmap
        completion_percentage: 0
      }
    });
  }

  /**
   * Fetches project by ID.
   */
  async getProjectById(id: number) {
    return await prisma.projects.findUnique({
      where: { id: BigInt(id) },
      include: { owner: true }
    });
  }

  /**
   * Updates project details.
   */
  async updateProject(id: number, data: Partial<{ name: string; status: ProjectStatus; deadline: Date; completion_percentage: number }>) {
    return await prisma.projects.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.status && { status: data.status }),
        ...(data.deadline && { deadline: data.deadline }),
        ...(data.completion_percentage !== undefined && { completion_percentage: data.completion_percentage }),
      }
    });
  }

  /**
   * Removes a project.
   */
  async deleteProject(id: number) {
    return await prisma.projects.delete({
      where: { id: BigInt(id) }
    });
  }

  /**
   * Fetches all projects for a team.
   */
  async getProjectsByTeam(teamId: number) {
    return await prisma.projects.findMany({
      where: { team_id: BigInt(teamId) },
      include: { owner: true }
    });
  }

  /**
   * Adds a dependency between projects.
   */
  async addDependency(projectId: number, dependsOnProjectId: number) {
    return await prisma.project_dependencies.create({
      data: {
        project_id: BigInt(projectId),
        depends_on_project_id: BigInt(dependsOnProjectId)
      }
    });
  }

  /**
   * Removes a specific dependency.
   */
  async removeDependency(id: number) {
    return await prisma.project_dependencies.delete({
      where: { id: BigInt(id) }
    });
  }
}

export const projectService = new ProjectService();
