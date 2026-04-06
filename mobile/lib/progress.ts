export interface ProjectProgressInput {
  budgetSpent: number;
  budgetTotal: number;
  totalLogs: number;
  totalOrders: number;
  completedOrders: number;
  totalRfqs: number;
  awardedRfqs: number;
  startDate: Date | number | string;
  endDate: Date | number | string;
}

export interface ProgressBreakdown {
  budget: number;
  procurement: number;
  delivery: number;
  timeline: number;
}

export function calculateProjectProgress(input: ProjectProgressInput): {
  overall: number;
  budget: number;
  procurement: number;
  delivery: number;
  timeline: number;
  breakdown: ProgressBreakdown;
} {
  const budget = input.budgetTotal > 0
    ? Math.min(100, (input.budgetSpent / input.budgetTotal) * 100)
    : 0;

  const procurement = input.totalRfqs > 0
    ? (input.awardedRfqs / input.totalRfqs) * 100
    : 0;

  const delivery = input.totalOrders > 0
    ? (input.completedOrders / input.totalOrders) * 100
    : 0;

  const now = Date.now();
  const start = new Date(input.startDate).getTime();
  const end = new Date(input.endDate).getTime();
  const timeline = end > start
    ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
    : 0;

  const overall = Math.round(
    budget     * 0.20 +
    procurement* 0.30 +
    delivery   * 0.40 +
    timeline   * 0.10
  );

  return {
    overall: Math.round(overall),
    budget: Math.round(budget),
    procurement: Math.round(procurement),
    delivery: Math.round(delivery),
    timeline: Math.round(timeline),
    breakdown: { budget, procurement, delivery, timeline },
  };
}

export interface SiteProgressInput {
  totalDaysLogged: number;
  ordersDeliveredToSite: number;
  ordersExpectedAtSite: number;
  lastActivityDate: Date | null | number | string;
  projectStartDate: Date | number | string;
  projectEndDate: Date | number | string;
}

export function calculateSiteProgress(input: SiteProgressInput): {
  overall: number;
  activity: number;
  deliveries: number;
  daysIdle: number;
} {
  const activity = input.totalDaysLogged > 0
    ? Math.min(100, (input.totalDaysLogged / 30) * 100)
    : 0;

  const deliveries = input.ordersExpectedAtSite > 0
    ? (input.ordersDeliveredToSite / input.ordersExpectedAtSite) * 100
    : 0;

  const daysIdle = input.lastActivityDate
    ? Math.floor((Date.now() - new Date(input.lastActivityDate).getTime()) / 86400000)
    : 999;

  const overall = Math.round(activity * 0.4 + deliveries * 0.6);

  return { 
    overall, 
    activity: Math.round(activity), 
    deliveries: Math.round(deliveries), 
    daysIdle 
  };
}

export function getProgressColor(value: number): string {
  if (value >= 80) return '#3A7D44';  // success
  if (value >= 50) return '#D4920A';  // amber
  if (value >= 25) return '#8A5F06';  // amber-dim
  return '#5C5A55';                   // text-3
}

export interface ProgressAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  icon: any; // using any for Icon props ease
}

export function getProgressAlerts(project: ProjectProgressInput): ProgressAlert[] {
  const alerts: ProgressAlert[] = [];
  const p = calculateProjectProgress(project);

  if (p.budget > p.delivery + 30) {
    alerts.push({
      type: 'warning',
      message: 'Budget consumption ahead of delivery progress',
      icon: 'warning-outline',
    });
  }

  if (p.timeline > 75 && p.delivery < 40) {
    alerts.push({
      type: 'error',
      message: 'Schedule risk — delivery behind timeline',
      icon: 'time-outline',
    });
  }

  if (p.delivery < 100 && project.totalLogs === 0) {
    alerts.push({
      type: 'info',
      message: 'No site activity logged yet',
      icon: 'clipboard-outline',
    });
  }

  return alerts;
}
