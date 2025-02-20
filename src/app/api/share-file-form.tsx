import { useState } from "react";

export function ShareFileForm() {
  const [fileId, setFileId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [sharedWithEmail, setSharedWithEmail] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("view"); // Default permission level

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
          File ID:
          <input
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Owner ID:
          <input
            type="text"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            required
          />
        </label>
      </div>
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
      <div>
        <label>
          Permission Level:
          <select
            value={permissionLevel}
            onChange={(e) => setPermissionLevel(e.target.value)}
          >
            <option value="view">View</option>
            <option value="edit">Edit</option>
          </select>
        </label>
      </div>
      <button type="submit">Share File</button>
    </form>
  );
}
