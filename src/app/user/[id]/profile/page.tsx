import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserItems } from "@/components/user-items";

interface Props {
  params: Promise<{ id: string }>;
  // If you're not using searchParams, you can either remove it or define it similarly.
  // searchParams: Promise<{ [key: string]: string }>;
}

const ProfilePage = async (props: Props) => {
  // Await the asynchronous values
  const resolvedParams = await props.params;
  // If you're using searchParams, await it too:
  // const resolvedSearchParams = await props.searchParams;

  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.id !== resolvedParams.id) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">
        Hello, {session.user.name}! This is your profile page.
      </h1>
      <UserItems />
    </div>
  );
};

export default ProfilePage;
