"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { dashboardAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle, Camera, ChefHat, User, TrendingUp,
  Weight, Ruler, Activity, Target, Loader2, ArrowRight,
} from "lucide-react";
import { formatGoal, formatActivityLevel, getBMIColor, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await dashboardAPI.getStats();
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-center">
          <p className="text-destructive font-medium">Could not load dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">
            Make sure your profile is set up. <Link href="/profile-setup" className="text-brand-600 underline">Setup now</Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  const { profile, total_chats, total_analyses, total_recipes, recent_chats } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, <span className="text-brand-600">{profile.name}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your nutrition snapshot for today.</p>
      </div>

      {/* Body Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Weight className="h-5 w-5" />}
          label="Weight"
          value={`${profile.weight} kg`}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<Ruler className="h-5 w-5" />}
          label="Height"
          value={`${profile.height} cm`}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="BMI"
          value={profile.bmi.toString()}
          subtitle={profile.bmi_category}
          color="bg-green-50 text-green-600"
          valueColor={getBMIColor(profile.bmi)}
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Goal"
          value={formatGoal(profile.goal)}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            href="/chat"
            icon={<MessageCircle className="h-6 w-6" />}
            title="Ask AI"
            description="Chat about nutrition, get meal ideas"
            color="from-blue-500 to-blue-600"
          />
          <ActionCard
            href="/food-analysis"
            icon={<Camera className="h-6 w-6" />}
            title="Analyze Food"
            description="Upload food image for nutrition info"
            color="from-purple-500 to-purple-600"
          />
          <ActionCard
            href="/recipe-generator"
            icon={<ChefHat className="h-6 w-6" />}
            title="Generate Recipe"
            description="Get recipes from your ingredients"
            color="from-orange-500 to-orange-600"
          />
        </div>
      </div>

      {/* Activity overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Chats</p>
                <p className="text-3xl font-bold mt-1">{total_chats}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Food Analyses</p>
                <p className="text-3xl font-bold mt-1">{total_analyses}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Camera className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recipes Generated</p>
                <p className="text-3xl font-bold mt-1">{total_recipes}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <ChefHat className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Chats + Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Conversations</CardTitle>
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recent_chats && recent_chats.length > 0 ? (
              <div className="space-y-3">
                {recent_chats.slice(0, 5).map((chat: any) => (
                  <div key={chat.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      chat.role === "user" ? "bg-brand-100 text-brand-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {chat.role === "user" ? <User className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(chat.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No conversations yet</p>
                <Link href="/chat">
                  <Button variant="link" className="text-brand-600 mt-1">Start chatting</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Age" value={`${profile.age} years`} />
            <Row label="Gender" value={profile.gender} capitalize />
            <Row label="Activity" value={formatActivityLevel(profile.activity_level)} />
            <Row label="BMI Status">
              <Badge variant={
                profile.bmi < 18.5 ? "info" :
                profile.bmi < 25 ? "success" :
                profile.bmi < 30 ? "warning" : "danger"
              }>{profile.bmi_category}</Badge>
            </Row>
            <Link href="/profile" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                <User className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle, color, valueColor }: {
  icon: React.ReactNode; label: string; value: string;
  subtitle?: string; color: string; valueColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${valueColor || ""}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({ href, icon, title, description, color }: {
  href: string; icon: React.ReactNode; title: string; description: string; color: string;
}) {
  return (
    <Link href={href} className="block group">
      <Card className="hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5 h-full">
        <CardContent className="pt-6">
          <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${color} text-white mb-3`}>
            {icon}
          </div>
          <h3 className="font-semibold text-foreground group-hover:text-brand-600 transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function Row({ label, value, capitalize, children }: {
  label: string; value?: string; capitalize?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      {children || (
        <span className={`font-medium ${capitalize ? "capitalize" : ""}`}>{value}</span>
      )}
    </div>
  );
}
