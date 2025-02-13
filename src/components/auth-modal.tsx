"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { Github } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in to Futura</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button className="w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full" onClick={() => signIn("github", { callbackUrl: "/" })}>
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
