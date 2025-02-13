import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
      <p className="mb-4">You must be signed in to view this page</p>
      <Link href="/api/auth/signin" className="text-blue-500 hover:text-blue-700 underline">
        Sign in
      </Link>
    </div>
  );
}
