"use client";

/**
 * Linked Accounts Component
 * 
 * Displays information about linked Internet Identity accounts,
 * including Principal ID and linking status.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Link as LinkIcon, Unlink } from "lucide-react";
import { useIICoAuth } from "@/hooks/use-ii-coauth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface LinkedAccountsProps {
  showActions?: boolean;
  className?: string;
}

export function LinkedAccounts({ showActions = true, className = "" }: LinkedAccountsProps) {
  const { hasLinkedII, linkedIcPrincipal, isCoAuthActive, statusMessage, statusClass } = useIICoAuth();
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  // Copy Principal to clipboard
  const copyPrincipalToClipboard = async () => {
    if (!linkedIcPrincipal) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(linkedIcPrincipal);
      toast({
        title: "Copied!",
        description: "Principal ID copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy principal ID to clipboard",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  // Handle linking II account
  const handleLinkII = () => {
    // This would typically redirect to II linking flow
    toast({
      title: "Link II Account",
      description: "Redirecting to Internet Identity linking...",
    });
    // TODO: Implement II linking flow
  };

  // Handle unlinking II account
  const handleUnlinkII = () => {
    // This would typically show confirmation dialog
    toast({
      title: "Unlink II Account",
      description: "This action will remove your linked Internet Identity account.",
      variant: "destructive",
    });
    // TODO: Implement II unlinking flow
  };

  if (!hasLinkedII) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-muted-foreground mb-4">
              <p className="text-sm">No Internet Identity account linked yet</p>
              <p className="text-xs mt-1">Link your II account to enable ICP operations</p>
            </div>
            {showActions && (
              <Button onClick={handleLinkII} variant="outline" size="sm">
                <LinkIcon className="h-4 w-4 mr-2" />
                Link Internet Identity
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Linked Accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* II Account Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Internet Identity
              </Badge>
              {isCoAuthActive && (
                <Badge variant="outline" className={`text-xs ${statusClass}`}>
                  {statusMessage}
                </Badge>
              )}
            </div>
            {showActions && (
              <Button
                onClick={handleUnlinkII}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Unlink
              </Button>
            )}
          </div>
          
          {/* Principal Display */}
          <div className="bg-muted rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Principal ID</p>
                <p className="font-mono text-sm break-all">{linkedIcPrincipal}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyPrincipalToClipboard}
                disabled={isCopying}
                className="ml-2 flex-shrink-0"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status Information */}
          <div className="text-xs text-muted-foreground">
            <p>This account is linked to your profile and can be used for ICP operations.</p>
            {isCoAuthActive && (
              <p className="mt-1">
                <span className="font-medium">Current Status:</span> {statusMessage}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleLinkII}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Manage Link
            </Button>
            <Button
              onClick={copyPrincipalToClipboard}
              variant="outline"
              size="sm"
              disabled={isCopying}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Principal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
