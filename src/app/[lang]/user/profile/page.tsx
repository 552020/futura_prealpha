"use client";

// this page is necessary to redirect to the correct profile page

export default function ProfileUnavailable() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          User profiles are not available.
        </h1>
      </div>
    </div>
  );
}
