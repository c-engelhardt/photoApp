// Public route that renders photo or album content from a share token.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchShare } from "../api/client";
import type { ShareResponse } from "../api/types";
import GalleryGrid from "../components/GalleryGrid";

const Share = () => {
  const { token } = useParams();
  const [data, setData] = useState<ShareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Token changes when users open different share links.
    if (!token) return;
    fetchShare(token)
      .then((response) => setData(response))
      .catch((err) => setError((err as Error).message));
  }, [token]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!data) {
    return <div className="loading">Loading shared view...</div>;
  }

  // Share responses are discriminated by resource type.
  if (data.resourceType === "photo") {
    const photo = data.resource;
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
          <a className="ghost" href={photo.sizes.original}>
            Download original
          </a>
        </div>
      </section>
    );
  }

  const album = data.resource;
  return (
    <section className="stack">
      <div className="headline">
        <div>
          <h2>{album.title}</h2>
          {album.description ? <p className="muted">{album.description}</p> : null}
        </div>
      </div>
      <GalleryGrid photos={album.photos} />
    </section>
  );
};

export default Share;
