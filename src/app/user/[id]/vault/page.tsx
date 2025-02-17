import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Profile } from "@/components/profile";

interface Props {
  params: Promise<{ id: string }>;
}

const VaultPage = async (props: Props) => {
  // Await the asynchronous values
  const resolvedParams = await props.params;
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.id !== resolvedParams.id) {
    redirect("/unauthorized");
  }

  return <Profile />;
};

export default VaultPage;
