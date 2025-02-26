"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TextUploadProps {
  className?: string;
  onTextSaved?: (data: { id: string; title: string; content: string }) => void;
}

export function TextUpload({ className, onTextSaved }: TextUploadProps) {
  const [textInput, setTextInput] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const session = useSession();

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!textInput.trim()) return;

    if (session.status !== "authenticated") {
      toast({
        title: "Authentication required",
        description: "You must be signed in to save text.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/save-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.data.user.id,
          title: title || "Untitled Memory",
          content: textInput,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save text.");
      }

      const data = await response.json();

      toast({
        title: "Text saved",
        description: "Your memory has been added to your vault.",
      });

      // Call the callback if it exists
      if (onTextSaved) {
        onTextSaved(data);
      }

      // Reset form
      setTextInput("");
      setTitle("");
    } catch (error) {
      console.error("Error saving text:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to save your text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span>Capture a Thought</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTextSubmit} className="space-y-3">
          <div>
            <Input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Title (optional)"
              className="mb-2"
            />
            <Input
              type="text"
              value={textInput}
              onChange={handleTextChange}
              placeholder="Write something to remember..."
              required
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleTextSubmit}
          disabled={isSubmitting || !textInput.trim()}
        >
          {isSubmitting ? "Saving..." : "Save Memory"}
        </Button>
      </CardFooter>
    </Card>
  );
}
