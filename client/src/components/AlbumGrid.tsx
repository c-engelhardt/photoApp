// Grid of album cards with optional click-to-navigate behavior.
import type { AlbumListItem } from "../api/types";

type AlbumGridProps = {
  albums: AlbumListItem[];
  onSelect?: (id: string) => void;
};

const AlbumGrid = ({ albums, onSelect }: AlbumGridProps) => {
  if (!albums.length) {
    return <div className="empty">No albums yet.</div>;
  }

  return (
    <div className="grid album-grid">
      {albums.map((album) => (
        <article
          key={album.id}
          className="card album-card"
          onClick={onSelect ? () => onSelect(album.id) : undefined}
          role={onSelect ? "button" : undefined}
        >
          {album.coverUrl ? (
            <img src={album.coverUrl} alt={album.title} loading="lazy" />
          ) : (
            // Placeholder keeps card heights stable when no cover is set.
            <div className="album-placeholder">No cover</div>
          )}
          <div className="card-body">
            <h3>{album.title}</h3>
            {album.description ? <p>{album.description}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
};

export default AlbumGrid;
