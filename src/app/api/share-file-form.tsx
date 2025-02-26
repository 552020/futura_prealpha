"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

// Define the schema for form validation
const formSchema = z.object({
  sharedWithEmail: z
    .string()
    .email("Invalid email address")
    .nonempty("Email is required"),
});

export function ShareFileForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sharedWithEmail: "",
    },
  });

  const onSubmit = async (data: { sharedWithEmail: string }) => {
    const ownerId = "placeholder-owner-id";
    const fileId = "placeholder-file-id";
    const permissionLevel = "view";

    const response = await fetch("/api/share-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileId,
        ownerId,
        sharedWithEmail: data.sharedWithEmail,
        permissionLevel,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      alert("An error occurred: " + errorText);
      return;
    }

    const responseData = await response.json();
    alert(responseData.message);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="sharedWithEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shared With Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="example@example.com"
                  {...field}
                  className="mx-auto  w-80"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Share File</Button>
      </form>
    </Form>
  );
}
