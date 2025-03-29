"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

export default function PostHogTestPage() {
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [isPosthogReady, setIsPosthogReady] = useState(false);

  useEffect(() => {
    // Check if PostHog is properly initialized
    if (posthog.config) {
      setIsPosthogReady(true);
    }
  }, []);

  const testEvents = [
    {
      name: "test_event",
      properties: { property: "test_value" },
    },
    {
      name: "button_click",
      properties: { button_type: "primary", location: "test_page" },
    },
    {
      name: "user_action",
      properties: { action_type: "test", timestamp: new Date().toISOString() },
    },
  ];

  const handleTestEvent = (eventName: string, properties: Record<string, any>) => {
    posthog.capture(eventName, properties);
    setLastEvent(`Event "${eventName}" sent at ${new Date().toLocaleTimeString()}`);
    console.log("PostHog event sent:", { eventName, properties });
  };

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">PostHog Test Page</h1>
        <p>This page is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">PostHog Test Page</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">PostHog Status</h2>
          <p className={`text-sm ${isPosthogReady ? "text-green-600" : "text-red-600"}`}>
            PostHog is {isPosthogReady ? "ready" : "not ready"}
          </p>
          {isPosthogReady && <p className="text-sm text-muted-foreground mt-1">Project ID: {posthog.config.token}</p>}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test Events</h2>
          <div className="grid gap-3">
            {testEvents.map((event) => (
              <Button key={event.name} onClick={() => handleTestEvent(event.name, event.properties)} variant="outline">
                Send "{event.name}"
              </Button>
            ))}
          </div>
        </div>

        {lastEvent && (
          <div className="mt-6 p-4 bg-muted rounded-md">
            <h2 className="text-sm font-semibold mb-2">Last Event Sent</h2>
            <p className="text-sm">{lastEvent}</p>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">{JSON.stringify(posthog.config, null, 2)}</pre>
        </div>
      </Card>
    </div>
  );
}
