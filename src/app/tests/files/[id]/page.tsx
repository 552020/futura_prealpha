// Server component to handle data fetching
export default async function FileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params to resolve the Promise
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="p-8 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-6">File Details</h1>
      <div className="bg-yellow-50 text-yellow-800 p-4 rounded mb-6">
        File ID: {id} - Database functionality has been removed
      </div>
    </div>
  );
}
