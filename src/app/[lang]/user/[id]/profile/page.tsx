import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LiveChatWrapper } from "@/components/chat/livechat-wrapper";

interface Props {
  params: Promise<{ id: string }>;
  // If you’re not using searchParams, you can either remove it or define it similarly.
  // searchParams: Promise<{ [key: string]: string }>;
}

const ProfilePage = async (props: Props) => {
  // Await the asynchronous values
  const resolvedParams = await props.params;
  // If you're using searchParams, await it too:
  // const resolvedSearchParams = await props.searchParams;

  const session = await auth();

  if (!session) {
    redirect("/en/signin");
  }

  if (session.user.id !== resolvedParams.id) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">Hello, {session.user.name}! This is your profile page.</h1>

      {/* LiveChat */}
      <LiveChatWrapper />
    </div>
  );
};

export default ProfilePage;
