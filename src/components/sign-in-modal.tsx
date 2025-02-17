"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignIn } from "@/components/auth-components";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Your Memories Forever</DialogTitle>
          <DialogDescription>
            Sign in now to ensure your memories are safely stored and accessible anytime, anywhere.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <SignIn className="w-[200px]" callbackUrl="/onboarding/profile">
            Sign In
          </SignIn>
          <Button variant="outline" onClick={onClose} className="w-[200px]">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
