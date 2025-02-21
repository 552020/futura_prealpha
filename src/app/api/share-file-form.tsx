import { useState } from "react";

export function ShareFileForm() {
  const [sharedWithEmail, setSharedWithEmail] = useState("");
  const ownerId = "placeholder-owner-id"; //Placeholder
  const fileId = "placeholder-file-id"; //Placeholder
  const permissionLevel = "view"; // Fixed permission level

  //This will happen rather after registration
  //Otherwise it makes flow more complicated

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/share-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileId,
        ownerId,
        sharedWithEmail,
        permissionLevel,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      alert(data.message);
    } else {
      const errorData = await response.json();
      alert(errorData.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Shared With Email:
          <input
            type="email"
            value={sharedWithEmail}
            onChange={(e) => setSharedWithEmail(e.target.value)}
            required
          />
        </label>
      </div>
      <button type="submit">Share File</button>
    </form>
  );
}
