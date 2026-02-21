// Generic photo grid with optional selection callback.
import type { PhotoListItem } from "../api/types";
import PhotoCard from "./PhotoCard";

type GalleryGridProps = {
  photos: PhotoListItem[];
  onSelect?: (id: string) => void;
};

const GalleryGrid = ({ photos, onSelect }: GalleryGridProps) => {
  if (!photos.length) {
    // Shared empty state keeps list pages visually consistent.
    return <div className="empty">No photos yet.</div>;
  }

  return (
    <div className="grid">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} onClick={onSelect ? () => onSelect(photo.id) : undefined} />
      ))}
    </div>
  );
};

export default GalleryGrid;
