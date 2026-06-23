"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, AlertCircle, Flame, Beef, Wheat, Droplet,
  Lightbulb, Sparkles, Target,
} from "lucide-react";

interface FoodResultProps {
  result: {
    id: string;
    analysis: {
      detected_foods: Array<{
        name: string;
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
        portion: string;
      }>;
      total_calories: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
      goal_assessment: string;
      is_suitable: boolean;
      explanation: string;
      alternatives: string[];
      recommendations: string;
    };
  };
}

export function FoodResult({ result }: FoodResultProps) {
  const { analysis } = result;
  const Icon = analysis.is_suitable ? CheckCircle2 : AlertCircle;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Goal Assessment */}
      <Card className={analysis.is_suitable ? "border-green-200" : "border-amber-200"}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${analysis.is_suitable ? "bg-green-100" : "bg-amber-100"}`}>
              <Icon className={`h-6 w-6 ${analysis.is_suitable ? "text-green-600" : "text-amber-600"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">
                  {analysis.is_suitable ? "Aligned with your goal" : "Not ideal for your goal"}
                </h3>
                <Badge variant={analysis.is_suitable ? "success" : "warning"}>
                  {analysis.is_suitable ? "Good Choice" : "Be Mindful"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{analysis.goal_assessment}</p>
              <p className="text-sm text-foreground/80">{analysis.explanation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MacroCard
          icon={<Flame className="h-5 w-5" />}
          label="Calories"
          value={analysis.total_calories}
          unit="kcal"
          color="bg-orange-50 text-orange-600"
        />
        <MacroCard
          icon={<Beef className="h-5 w-5" />}
          label="Protein"
          value={analysis.total_protein}
          unit="g"
          color="bg-red-50 text-red-600"
        />
        <MacroCard
          icon={<Wheat className="h-5 w-5" />}
          label="Carbs"
          value={analysis.total_carbs}
          unit="g"
          color="bg-yellow-50 text-yellow-600"
        />
        <MacroCard
          icon={<Droplet className="h-5 w-5" />}
          label="Fat"
          value={analysis.total_fat}
          unit="g"
          color="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Detected Foods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Detected Items ({analysis.detected_foods.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.detected_foods.map((food, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div>
                  <p className="font-medium">{food.name}</p>
                  <p className="text-xs text-muted-foreground">{food.portion}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{food.calories} kcal</p>
                  <p className="text-xs text-muted-foreground">
                    P {food.protein_g}g · C {food.carbs_g}g · F {food.fat_g}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alternatives */}
      {analysis.alternatives && analysis.alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              Healthier Alternatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.alternatives.map((alt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                  <span>{alt}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis.recommendations && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                <Lightbulb className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900 mb-1">Personalized Tip</p>
                <p className="text-sm text-blue-800">{analysis.recommendations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-center text-muted-foreground italic">
        All nutritional values are AI estimates and may not be exact.
      </p>
    </div>
  );
}

function MacroCard({ icon, label, value, unit, color }: {
  icon: React.ReactNode; label: string; value: number; unit: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className={`p-1.5 rounded-md ${color}`}>{icon}</div>
        </div>
        <p className="text-2xl font-bold">
          {value}<span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </p>
      </CardContent>
    </Card>
  );
}