export const EPSILON = 0.0001;

export const isTargetReached = (currentValue: number, target: number): boolean => {
  return Math.abs(currentValue - target) < EPSILON;
};

export const formatNumber = (num: number): string => {
  if (Math.abs(num - Math.round(num)) < EPSILON) {
    return Math.round(num).toString();
  }
  // Check for common reciprocals for display cleanliness
  const inverse = 1 / num;
  if (Math.abs(inverse - Math.round(inverse)) < EPSILON) {
    return `1/${Math.round(inverse)}`;
  }
  return Number(num.toFixed(3)).toString();
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
