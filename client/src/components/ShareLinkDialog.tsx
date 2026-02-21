// Admin control to create time-limited share links for photos/albums.
import { useState } from "react";
import { createShareLink } from "../api/client";

type ShareLinkDialogProps = {
  resourceType: "photo" | "album";
  resourceId: string;
};

const ShareLinkDialog = ({ resourceType, resourceId }: ShareLinkDialogProps) => {
  const [hours, setHours] = useState(24);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend accepts an absolute timestamp, so convert relative hours here.
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const result = await createShareLink({ resourceType, resourceId, expiresAt });
      setToken(result.token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Build a copy-ready public URL from the newly minted token.
  const shareUrl = token ? `${window.location.origin}/share/${token}` : "";

  return (
    <div className="share-box">
      <div className="share-row">
        <label htmlFor="share-hours">Expires in</label>
        <input
          id="share-hours"
          type="number"
          min={1}
          value={hours}
          onChange={(event) => setHours(Number(event.target.value))}
        />
        <span>hours</span>
        <button className="primary" onClick={handleCreate} disabled={loading}>
          {loading ? "Creating..." : "Create share link"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {token ? (
        <div className="share-result">
          <span>Share URL</span>
          <input value={shareUrl} readOnly />
        </div>
      ) : null}
    </div>
  );
};

export default ShareLinkDialog;
