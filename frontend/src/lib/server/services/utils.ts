/**
 * Calculate BMI from weight (kg) and height (cm).
 * Returns BMI value and category.
 */
export function calculateBMI(weight: number, height: number): {
  bmi: number;
  category: string;
} {
  const heightM = height / 100;
  const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;

  let category: string;
  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 25) category = "Normal";
  else if (bmi < 30) category = "Overweight";
  else category = "Obese";

  return { bmi, category };
}

/**
 * Format goal for prompt injection.
 */
export function formatGoal(goal: string): string {
  return goal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}