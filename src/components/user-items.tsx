"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image as ImageIcon, File } from "lucide-react";
import Image from "next/image";

interface UserItem {
  id: string;
  title?: string;
  content?: string;
  url?: string;
  filename?: string;
  createdAt: string;
}

interface ItemsByType {
  texts: UserItem[];
  photos: UserItem[];
  files: UserItem[];
}

export function UserItems() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ItemsByType>({
    texts: [],
    photos: [],
    files: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserItems = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/user-items?userId=${session.user.id}`);
        if (!response.ok) throw new Error("Failed to fetch items");
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching user items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserItems();
  }, [session?.user?.id]);

  if (isLoading) {
    return <div>Loading your items...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Texts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span>Your Texts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.texts.length === 0 ? (
            <p className="text-muted-foreground">No texts yet</p>
          ) : (
            <ul className="space-y-2">
              {items.texts.map((text) => (
                <li key={text.id} className="flex items-center gap-2">
                  <span>{text.title || "Untitled"}</span>
                  <span className="text-sm text-muted-foreground">{new Date(text.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Photos Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            <span>Your Photos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.photos.length === 0 ? (
            <p className="text-muted-foreground">No photos yet</p>
          ) : (
            <ul className="space-y-2">
              {items.photos.map((photo) => (
                <li key={photo.id} className="flex items-center gap-2">
                  <Image
                    src={photo.url}
                    alt={photo.title || "Uploaded photo"}
                    width={300}
                    height={300}
                    className="rounded-lg object-cover"
                  />
                  <span className="text-sm text-muted-foreground">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Files Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5" />
            <span>Your Files</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.files.length === 0 ? (
            <p className="text-muted-foreground">No files yet</p>
          ) : (
            <ul className="space-y-2">
              {items.files.map((file) => (
                <li key={file.id} className="flex items-center gap-2">
                  <span>{file.filename}</span>
                  <span className="text-sm text-muted-foreground">{new Date(file.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
