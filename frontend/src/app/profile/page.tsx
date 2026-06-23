"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { profileAPI } from "@/lib/api";
import { calculateBMI, getBMICategory, getBMIColor, formatGoal, formatActivityLevel } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { User, Save, Loader2, Edit, X, TrendingUp } from "lucide-react";
import type { Gender, ActivityLevel, Goal } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await profileAPI.get();
      return res.data;
    },
  });

  const [form, setForm] = useState({
    name: "", age: "", gender: "" as Gender | "",
    weight: "", height: "",
    activity_level: "" as ActivityLevel | "",
    goal: "" as Goal | "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        age: profile.age.toString(),
        gender: profile.gender,
        weight: profile.weight.toString(),
        height: profile.height.toString(),
        activity_level: profile.activity_level,
        goal: profile.goal,
      });
    }
  }, [profile]);

  const liveBMI = form.weight && form.height
    ? calculateBMI(parseFloat(form.weight), parseFloat(form.height))
    : null;

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await profileAPI.update({
        name: form.name,
        age: parseInt(form.age),
        gender: form.gender,
        weight: parseFloat(form.weight),
        height: parseFloat(form.height),
        activity_level: form.activity_level,
        goal: form.goal,
      });
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
      setEditing(false);
      refetch();
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not save profile",
      });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p>Profile not found.</p>
          <Button className="mt-3" onClick={() => router.push("/profile-setup")}>
            Set Up Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">View and update your information</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4 mr-2" /> Edit Profile
          </Button>
        ) : (
          <Button variant="outline" onClick={() => { setEditing(false); refetch(); }}>
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BMI Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-brand-600" /> BMI
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className={`text-5xl font-bold ${getBMIColor(editing && liveBMI ? liveBMI : profile.bmi)}`}>
              {editing && liveBMI ? liveBMI : profile.bmi}
            </p>
            <Badge variant={
              (editing && liveBMI ? liveBMI : profile.bmi) < 18.5 ? "info" :
              (editing && liveBMI ? liveBMI : profile.bmi) < 25 ? "success" :
              (editing && liveBMI ? liveBMI : profile.bmi) < 30 ? "warning" : "danger"
            } className="mt-2">
              {editing && liveBMI ? getBMICategory(liveBMI) : profile.bmi_category}
            </Badge>
            <div className="mt-4 h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-red-400 relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-700 shadow"
                style={{ left: `${Math.min(Math.max((((editing && liveBMI ? liveBMI : profile.bmi) - 15) / 25) * 100, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Goal: {formatGoal(profile.goal)}</p>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-brand-600" /> Personal Details
            </CardTitle>
            <CardDescription>
              {editing ? "Make changes to your profile" : "Your saved information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" editing={editing} value={profile.name}>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
              </Field>
              <Field label="Age" editing={editing} value={`${profile.age} years`}>
                <Input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} />
              </Field>
              <Field label="Gender" editing={editing} value={profile.gender} capitalize>
                <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Weight" editing={editing} value={`${profile.weight} kg`}>
                <Input type="number" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
              </Field>
              <Field label="Height" editing={editing} value={`${profile.height} cm`}>
                <Input type="number" value={form.height} onChange={(e) => update("height", e.target.value)} />
              </Field>
              <Field label="Activity Level" editing={editing} value={formatActivityLevel(profile.activity_level)}>
                <Select value={form.activity_level} onValueChange={(v) => update("activity_level", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Goal" editing={editing} value={formatGoal(profile.goal)} className="sm:col-span-2">
                <Select value={form.goal} onValueChange={(v) => update("goal", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="weight_gain">Weight Gain</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {editing && (
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, editing, value, children, capitalize, className }: {
  label: string; editing: boolean; value: string;
  children: React.ReactNode; capitalize?: boolean; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {editing ? children : (
        <p className={`text-sm font-medium pt-1 ${capitalize ? "capitalize" : ""}`}>{value}</p>
      )}
    </div>
  );
}
