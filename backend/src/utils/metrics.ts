// src/utils/metrics.ts

import { Decimal } from 'decimal.js';

interface HealthMetrics {
  productivity: number;
  collaboration: number;
  velocity: number;
}

/**
 * Calculates the overall health score based on three core metrics:
 * Productivity (40%), Collaboration (30%), Velocity (30%).
 * 
 * Formula: (P * 0.4) + (C * 0.3) + (V * 0.3)
 */
export const calculateOverallHealthScore = (metrics: HealthMetrics): number => {
  const { productivity, collaboration, velocity } = metrics;
  
  const score = new Decimal(productivity).mul(0.4)
    .plus(new Decimal(collaboration).mul(0.3))
    .plus(new Decimal(velocity).mul(0.3));
    
  return score.toNumber();
};

/**
 * Helper to determine categorical health status based on score:
 * - Red (< 50)
 * - Yellow (50-75)
 * - Green (> 75)
 */
export const getHealthStatus = (score: number): 'critical' | 'at-risk' | 'healthy' => {
  if (score < 50) return 'critical';
  if (score < 75) return 'at-risk';
  return 'healthy';
};
