"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award, Sparkles, Zap, Clock, Flame, Beef, Wheat, Droplet,
  ChevronDown, ChevronUp, ChefHat, Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeResultsProps {
  result: {
    id: string;
    output: {
      detected_ingredients: string[];
      best_match: any;
      alternative: any;
      quick_option: any;
    };
  };
}

export function RecipeResults({ result }: RecipeResultsProps) {
  const { output } = result;
  const recipes = [
    { ...output.best_match, type: "best", icon: Award, color: "amber", title: "Best Match" },
    { ...output.alternative, type: "alt", icon: Sparkles, color: "blue", title: "Alternative" },
    { ...output.quick_option, type: "quick", icon: Zap, color: "green", title: "Quick Option" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Detected Ingredients */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="pt-6">
          <p className="text-sm font-semibold text-orange-900 mb-2">
            🥗 Detected Ingredients
          </p>
          <div className="flex flex-wrap gap-2">
            {output.detected_ingredients.map((ing, idx) => (
              <Badge key={idx} variant="secondary" className="capitalize">
                {ing}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recipe Cards */}
      <div className="space-y-4">
        {recipes.map((r) => (
          <RecipeCard key={r.type} ranked={r} />
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground italic">
        Nutritional values are AI estimates and personalized to your profile.
      </p>
    </div>
  );
}

function RecipeCard({ ranked }: { ranked: any }) {
  const [expanded, setExpanded] = useState(ranked.rank === 1);
  const { recipe, reason, modifications, color, icon: Icon, title } = ranked;

  const colorMap: Record<string, { bg: string; text: string; border: string; ring: string }> = {
    amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", ring: "ring-amber-300" },
    blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", ring: "ring-blue-300" },
    green: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", ring: "ring-green-300" },
  };
  const c = colorMap[color];

  return (
    <Card className={cn(c.border, ranked.rank === 1 && `ring-2 ${c.ring}`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("p-2.5 rounded-lg shrink-0", c.bg)}>
              <Icon className={cn("h-5 w-5", c.text)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className={cn(c.text, c.border)}>
                  #{ranked.rank} {title}
                </Badge>
                <Badge variant="secondary" className="capitalize text-xs">
                  {recipe.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-lg">{recipe.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2">
          <Stat icon={<Flame className="h-3.5 w-3.5" />} label="Calories" value={`${recipe.calories}`} />
          <Stat icon={<Clock className="h-3.5 w-3.5" />} label="Time" value={`${recipe.prep_time}m`} />
          <Stat icon={<Beef className="h-3.5 w-3.5" />} label="Protein" value={`${recipe.protein}g`} />
          <Stat icon={<Wheat className="h-3.5 w-3.5" />} label="Carbs" value={`${recipe.carbs}g`} />
        </div>

        {/* Why this recipe */}
        <div className={cn("p-3 rounded-lg flex gap-2", c.bg)}>
          <Lightbulb className={cn("h-4 w-4 shrink-0 mt-0.5", c.text)} />
          <p className="text-sm text-foreground/80">{reason}</p>
        </div>

        {/* Expand button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? (
            <><ChevronUp className="h-4 w-4 mr-1" /> Hide details</>
          ) : (
            <><ChevronDown className="h-4 w-4 mr-1" /> Show ingredients & steps</>
          )}
        </Button>

        {/* Expanded content */}
        {expanded && (
          <div className="space-y-4 pt-2 border-t">
            {/* Ingredients */}
            <div>
              <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-muted-foreground" />
                Ingredients
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                {recipe.ingredients.map((ing: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className={cn("shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full", c.bg)} style={{backgroundColor: 'currentColor'}}></span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div>
              <p className="font-semibold text-sm mb-2">Instructions</p>
              <ol className="space-y-2">
                {recipe.steps.map((step: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className={cn(
                      "shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                      c.bg, c.text
                    )}>
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Modifications */}
            {modifications && modifications.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">Suggested Modifications</p>
                <ul className="space-y-1 text-sm">
                  {modifications.map((mod: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 mt-1 text-muted-foreground" />
                      <span className="text-muted-foreground">{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags + Fat */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex flex-wrap gap-1.5">
                {recipe.tags?.slice(0, 4).map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Droplet className="h-3.5 w-3.5" />
                {recipe.fats}g fat
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/40">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}