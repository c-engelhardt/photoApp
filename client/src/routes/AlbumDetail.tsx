// Detailed album page that reuses the photo grid for album contents.
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAlbum } from "../api/client";
import type { AlbumDetail as AlbumDetailType } from "../api/types";
import { AuthContext } from "../App";
import ShareLinkDialog from "../components/ShareLinkDialog";
import GalleryGrid from "../components/GalleryGrid";

const AlbumDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [album, setAlbum] = useState<AlbumDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the currently selected album id from the URL.
    if (!id) return;
    fetchAlbum(id)
      .then((data) => setAlbum(data))
      .catch((err) => setError((err as Error).message));
  }, [id]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!album) {
    return <div className="loading">Loading album...</div>;
  }

  return (
    <section className="stack">
      <div className="headline">
        <div>
          <h2>{album.title}</h2>
          {album.description ? <p className="muted">{album.description}</p> : null}
        </div>
        {user?.role === "ADMIN" ? (
          // Admins can share entire albums, not just individual photos.
          <ShareLinkDialog resourceType="album" resourceId={album.id} />
        ) : null}
      </div>
      <GalleryGrid photos={album.photos} onSelect={(photoId) => navigate(`/photo/${photoId}`)} />
    </section>
  );
};

export default AlbumDetail;
