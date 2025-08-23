"use client";

import { useAuthGuard } from "@/utils/authentication";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { isAuthorized, isTemporaryUser, userId, isLoading } = useAuthGuard();

  if (!isAuthorized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your storage, frontend, and account preferences.</p>
        </div>

        {isTemporaryUser && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Temporary Account</CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                You are using a temporary account. Complete your signup to keep your account permanently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full">
                Complete Signup
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="web2-storage">Web2</Label>
                <p className="text-sm text-muted-foreground">Vercel + Neon</p>
              </div>
              <Switch id="web2-storage" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="web3-storage">Web3</Label>
                <p className="text-sm text-muted-foreground">ICP</p>
              </div>
              <Switch id="web3-storage" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="web3-managed">Shared Canister</Label>
              </div>
              <Switch id="web3-managed" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frontend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="web2-frontend">Web2</Label>
                <p className="text-sm text-muted-foreground">Vercel</p>
              </div>
              <Switch id="web2-frontend" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="web3-frontend">Web3</Label>
                <p className="text-sm text-muted-foreground">ICP</p>
              </div>
              <Switch id="web3-frontend" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose how you want to be notified about your memories and family updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates about new memories and family activity.</p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone shares memories with you.</p>
              </div>
              <Switch id="push-notifications" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Control who can see your memories and profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visibility">Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to find your profile and see basic information.
                </p>
              </div>
              <Switch id="profile-visibility" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="memory-sharing">Memory Sharing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow family members to share your memories with others.
                </p>
              </div>
              <Switch id="memory-sharing" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Account Type</Label>
                <p className="text-sm text-muted-foreground">
                  {isTemporaryUser ? "Temporary Account" : "Permanent Account"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>User ID</Label>
                <p className="text-sm text-muted-foreground font-mono">{userId}</p>
              </div>
            </div>
            <Separator />
            <Button variant="outline" className="w-full">
              Export My Data
            </Button>
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
