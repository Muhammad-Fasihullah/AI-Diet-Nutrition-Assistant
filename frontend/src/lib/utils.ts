import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateBMI(weight: number, height: number): number {
  const heightM = height / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function getBMIColor(bmi: number): string {
  if (bmi < 18.5) return "text-blue-500";
  if (bmi < 25) return "text-green-500";
  if (bmi < 30) return "text-yellow-500";
  return "text-red-500";
}

export function formatGoal(goal: string): string {
  const map: Record<string, string> = {
    weight_loss: "Weight Loss",
    weight_gain: "Weight Gain",
    maintain: "Maintain Weight",
  };
  return map[goal] ?? goal;
}

export function formatActivityLevel(level: string): string {
  const map: Record<string, string> = {
    sedentary: "Sedentary",
    light: "Light Activity",
    moderate: "Moderate Activity",
    active: "Very Active",
  };
  return map[level] ?? level;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}
