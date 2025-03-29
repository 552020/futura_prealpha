import { notFound } from "next/navigation";
import { db } from "@/db/db";
import { memoryShares } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { findMemory } from "@/app/api/memories/utils/memory";
import { MemoryViewer } from "@/components/memory-viewer";
import { Card } from "@/components/ui/card";

interface SharedMemoryPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    code: string;
  }>;
}

export default async function SharedMemoryPage({ params, searchParams }: SharedMemoryPageProps) {
  const { id } = await params;
  const { code } = await searchParams;

  if (!code) {
    notFound();
  }

  try {
    // First try to find the memory
    const memory = await findMemory(id);
    if (!memory) {
      notFound();
    }

    let isOwner = false;
    let accessLevel: "read" | "write" = "read";

    // Check if this is an owner's secure code
    if (memory.data.ownerSecureCode === code) {
      isOwner = true;
      accessLevel = "write";
    } else {
      // If not owner's code, check if it's a valid share code
      const share = await db.query.memoryShares.findFirst({
        where: and(eq(memoryShares.memoryId, id), eq(memoryShares.inviteeSecureCode, code)),
      });

      if (!share) {
        notFound();
      }

      accessLevel = share.accessLevel;
    }

    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">{isOwner ? "Your Memory" : "Shared Memory"}</h1>
            <p className="text-muted-foreground">
              {isOwner ? "You are viewing this memory as the owner" : `You have ${accessLevel} access to this memory`}
            </p>
          </div>

          <MemoryViewer memory={memory} isOwner={isOwner} accessLevel={accessLevel} />
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error accessing shared memory:", error);
    notFound();
  }
}
