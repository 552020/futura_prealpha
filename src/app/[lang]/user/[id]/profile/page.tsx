import React from "react";

interface Props {
  params: Promise<{ id: string }>;
}

const ProfilePage = async (props: Props) => {
  // Await the asynchronous values
  const resolvedParams = await props.params;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">Profile Page</h1>
      <p>User ID: {resolvedParams.id}</p>
    </div>
  );
};

export default ProfilePage;
