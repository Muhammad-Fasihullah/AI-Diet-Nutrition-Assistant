"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recipeAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeUploader } from "@/components/recipe/recipe-uploader";
import { RecipeResults } from "@/components/recipe/recipe-results";
import {
  ChefHat, History, Loader2, Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function RecipeGeneratorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentResult, setCurrentResult] = useState<any>(null);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["recipe-history"],
    queryFn: async () => {
      const res = await recipeAPI.getHistory();
      return res.data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const res = await recipeAPI.generate(formData);
      return res.data;
    },
    onSuccess: (data) => {
      setCurrentResult(data);
      queryClient.invalidateQueries({ queryKey: ["recipe-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Recipes generated!", description: "Scroll down to see your personalized recipes." });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Could not generate recipes",
      });
    },
  });

  function handleFilesSelected(files: File[]) {
    setCurrentResult(null);
    generateMutation.mutate(files);
  }

  function handleHistoryClick(item: any) {
    setCurrentResult({
      id: item.id,
      output: item.final_output,
      created_at: item.created_at,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ChefHat className="h-6 w-6 text-orange-600" />
          </div>
          Recipe Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload images of your ingredients. AI will identify them and generate 3 personalized recipes.
        </p>
      </div>

      {/* Uploader */}
      <RecipeUploader
        onFilesSelected={handleFilesSelected}
        isGenerating={generateMutation.isPending}
      />

      {/* Loading */}
      {generateMutation.isPending && (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-10 w-10 text-orange-600 animate-spin" />
            <p className="font-medium text-lg">Cooking up your recipes...</p>
            <p className="text-sm text-muted-foreground">Detecting ingredients and crafting personalized options</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>This may take 10-20 seconds</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {currentResult && !generateMutation.isPending && (
        <RecipeResults result={currentResult} />
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-muted-foreground" />
            Past Generations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : history && history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                >
                  <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                    <ChefHat className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.final_output?.best_match?.recipe?.name || "Recipes"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {item.detected_ingredients?.slice(0, 3).map((ing: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{ing}</Badge>
                      ))}
                      {item.detected_ingredients?.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{item.detected_ingredients.length - 3} more</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(item.created_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recipes yet. Upload ingredient images above!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}