// Detailed view for a single photo, with admin-only share controls.
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPhoto } from "../api/client";
import type { PhotoDetail as PhotoDetailType } from "../api/types";
import { AuthContext } from "../App";
import ShareLinkDialog from "../components/ShareLinkDialog";

const PhotoDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [photo, setPhoto] = useState<PhotoDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reload whenever route id changes.
    if (!id) return;
    fetchPhoto(id)
      .then((data) => setPhoto(data))
      .catch((err) => setError((err as Error).message));
  }, [id]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!photo) {
    return <div className="loading">Loading photo...</div>;
  }

  return (
    <section className="detail">
      <div className="detail-media">
        <img src={photo.sizes["768"]} alt={photo.title} />
      </div>
      <div className="detail-info">
        <h2>{photo.title}</h2>
        {photo.description ? <p>{photo.description}</p> : null}
        <div className="tag-row">
          {photo.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="detail-meta">
          <span>
            {photo.width} x {photo.height}
          </span>
          <a className="ghost" href={photo.sizes.original}>
            Download original
          </a>
        </div>
        {user?.role === "ADMIN" ? (
          // Only admins can mint share links from the authenticated UI.
          <div className="detail-share">
            <h4>Share link</h4>
            <ShareLinkDialog resourceType="photo" resourceId={photo.id} />
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PhotoDetail;
