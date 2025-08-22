interface UploadResponse {
  data: {
    id: string;
    ownerId: string;
  };
}

export const uploadFile = async (
  file: File,
  isOnboarding: boolean,
  existingUserId?: string
): Promise<UploadResponse> => {
  // If we're in onboarding flow, always use onboarding endpoint
  // If not, use the regular upload endpoint which requires authentication
  const endpoint = isOnboarding ? "/api/memories/upload/onboarding/file" : "/api/memories/upload";

  // Upload file
  const formData = new FormData();
  formData.append("file", file);

  if (existingUserId) {
    formData.append("existingUserId", existingUserId);
  }

  console.log("📤 Sending file to server...");

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Server returned error:", data);
    throw new Error(data.error || "Upload failed");
  }

  return data;
};
