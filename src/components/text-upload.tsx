"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
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

  // const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setTextInput(e.target.value);
  // };

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
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Capture a Thought
        </CardTitle>
        <CardDescription>
          Write down a memory or thought to preserve
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleTextSubmit}
          className="grid w-full items-center gap-4"
        >
          <div className="grid w-full gap-2">
            <Input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Give your memory a title (optional)"
              className="w-full"
            />
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Write something to remember..."
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleTextSubmit}
          disabled={isSubmitting || !textInput.trim()}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Save Memory
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
