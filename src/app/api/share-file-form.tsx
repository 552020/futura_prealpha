"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

//call with:     <ShareFileForm resourceId="123" resourceType="file" />
// Define the schema for form validation
const formSchema = z.object({
  sharedWithEmail: z
    .string()
    .email("Invalid email address")
    .nonempty("Email is required"),
});

interface ShareFileFormProps {
  resourceId: string;
  resourceType: "file" | "photo" | "text";
}

export function ShareFileForm({
  resourceId,
  resourceType,
}: ShareFileFormProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sharedWithEmail: "",
    },
  });

  const onSubmit = async (data: { sharedWithEmail: string }) => {
    try {
      const response = await fetch("/api/share-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceType,
          resourceId,
          shareWith: {
            email: data.sharedWithEmail,
          },
          expiresAt: null, // Optional: you can add an expiration date picker if needed
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // const responseData = await response.json();

      toast({
        title: "Shared successfully",
        description: `Resource has been shared with ${data.sharedWithEmail}`,
      });

      form.reset();
    } catch (error) {
      console.error("Share error:", error);
      toast({
        variant: "destructive",
        title: "Error sharing resource",
        description: "Please try again later.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="sharedWithEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Share with email</FormLabel>
              <FormControl>
                <Input
                  placeholder="example@example.com"
                  {...field}
                  className="mx-auto w-80"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Share</Button>
      </form>
    </Form>
  );
}
