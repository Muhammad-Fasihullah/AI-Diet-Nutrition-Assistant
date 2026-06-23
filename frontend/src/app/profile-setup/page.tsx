"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { profileAPI } from "@/lib/api";
import { calculateBMI, getBMICategory } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, Weight, Ruler, Activity, ChevronRight, ChevronLeft,
  Salad, Loader2, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Gender, ActivityLevel, Goal } from "@/types";

const STEPS = ["Personal", "Body", "Lifestyle", "Review"];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "" as Gender | "",
    weight: "",
    height: "",
    activity_level: "" as ActivityLevel | "",
    goal: "" as Goal | "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const bmi = form.weight && form.height
    ? calculateBMI(parseFloat(form.weight), parseFloat(form.height))
    : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  function bmiColor(bmi: number) {
    if (bmi < 18.5) return "info";
    if (bmi < 25) return "success";
    if (bmi < 30) return "warning";
    return "danger";
  }

  function canProceed() {
    if (step === 0) return form.name && form.age && form.gender;
    if (step === 1) return form.weight && form.height;
    if (step === 2) return form.activity_level && form.goal;
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await profileAPI.create({
        name: form.name,
        age: parseInt(form.age),
        gender: form.gender,
        weight: parseFloat(form.weight),
        height: parseFloat(form.height),
        activity_level: form.activity_level,
        goal: form.goal,
      });
      toast({ title: "Profile saved!", description: "Welcome to your nutrition assistant." });
      router.push("/dashboard");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Could not save profile",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-brand-100 rounded-full">
              <Salad className="h-8 w-8 text-brand-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Set Up Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Help us personalize your nutrition experience
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-6 gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
                i < step ? "bg-brand-600 text-white" :
                i === step ? "bg-brand-600 text-white ring-2 ring-brand-300" :
                "bg-muted text-muted-foreground"
              )}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                i === step ? "text-brand-700" : "text-muted-foreground"
              )}>{label}</span>
              {i < STEPS.length - 1 && (
                <div className={cn("w-6 h-0.5 mx-1", i < step ? "bg-brand-400" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 0 && <><User className="h-5 w-5 text-brand-600" /> Personal Information</>}
              {step === 1 && <><Ruler className="h-5 w-5 text-brand-600" /> Body Measurements</>}
              {step === 2 && <><Activity className="h-5 w-5 text-brand-600" /> Lifestyle & Goals</>}
              {step === 3 && <><CheckCircle2 className="h-5 w-5 text-brand-600" /> Review Your Profile</>}
            </CardTitle>
            <CardDescription>
              {step === 0 && "Tell us a bit about yourself"}
              {step === 1 && "We use this to calculate your BMI and calorie needs"}
              {step === 2 && "This helps us personalize your recommendations"}
              {step === 3 && "Confirm your details before saving"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 22"
                    min={1} max={120}
                    value={form.age}
                    onChange={(e) => update("age", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="e.g. 70"
                      className="pl-10"
                      value={form.weight}
                      onChange={(e) => update("weight", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="e.g. 170"
                      className="pl-10"
                      value={form.height}
                      onChange={(e) => update("height", e.target.value)}
                    />
                  </div>
                </div>
                {bmi && (
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Your BMI</p>
                        <p className="text-3xl font-bold text-foreground">{bmi}</p>
                      </div>
                      <Badge variant={bmiColor(bmi) as "info" | "success" | "warning" | "danger"}>
                        {bmiCategory}
                      </Badge>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-red-400 relative">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-700 shadow"
                        style={{ left: `${Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Activity Level</Label>
                  <Select value={form.activity_level} onValueChange={(v) => update("activity_level", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (desk job, little exercise)</SelectItem>
                      <SelectItem value="light">Light (1-3 days/week exercise)</SelectItem>
                      <SelectItem value="moderate">Moderate (3-5 days/week exercise)</SelectItem>
                      <SelectItem value="active">Active (6-7 days/week exercise)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Your Goal</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "weight_loss", label: "Weight Loss", emoji: "📉" },
                      { value: "maintain", label: "Maintain", emoji: "⚖️" },
                      { value: "weight_gain", label: "Weight Gain", emoji: "📈" },
                    ].map(({ value, label, emoji }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update("goal", value)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all text-sm font-medium",
                          form.goal === value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-border hover:border-brand-300 hover:bg-muted/50"
                        )}
                      >
                        <span className="text-2xl mb-1">{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {[
                  { label: "Name", value: form.name },
                  { label: "Age", value: `${form.age} years` },
                  { label: "Gender", value: form.gender },
                  { label: "Weight", value: `${form.weight} kg` },
                  { label: "Height", value: `${form.height} cm` },
                  { label: "BMI", value: bmi ? `${bmi} (${bmiCategory})` : "-" },
                  { label: "Activity Level", value: form.activity_level?.replace("_", " ") },
                  { label: "Goal", value: form.goal?.replace("_", " ") },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-semibold capitalize">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Profile</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
