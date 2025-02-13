import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import Image from "next/image";

// Use Next.js's built-in types for pages with dynamic segments
type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function ProfilePage({ params }: Props) {
  const session = await auth();

  // Redirect if not logged in
  if (!session) {
    redirect("/api/auth/signin");
  }

  // Protect users from viewing other profiles
  if (session.user.id !== params.id) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="bg-card rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt="Profile picture"
              width={128}
              height={128}
              className="rounded-full"
              priority
            />
          )}
          <div>
            <h2 className="text-2xl font-semibold">{session.user.name}</h2>
            <p className="text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
