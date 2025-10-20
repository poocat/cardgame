import { useState } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "@common/api/routes";

export const NewRoom = () => {
  const navigate = useNavigate();

  const [hostName, setHostName] = useState("");

  const handleSubmit = async () => {
    if (!hostName) return;
    try {
      const payload = ROUTES.rooms.methods.post.schemas.requestBody.parse({
        hostName,
      });
      const body = JSON.stringify(payload);
      const response = await fetch("/api/rooms", {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const j = await response.json();
        const d = ROUTES.rooms.methods.post.schemas.responseBody.parse(j);
        navigate(`/rooms/${d.roomId}?playerId=${d.hostId}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div>
        <input value={hostName} onChange={(e) => setHostName(e.target.value)} />
      </div>
      <div>
        <button disabled={!hostName} onClick={handleSubmit}>
          Open New Room
        </button>
      </div>
    </div>
  );
};
