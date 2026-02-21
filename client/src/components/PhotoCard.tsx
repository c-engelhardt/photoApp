// Compact photo preview card used across gallery and album views.
import type { PhotoListItem } from "../api/types";

type PhotoCardProps = {
  photo: PhotoListItem;
  onClick?: () => void;
};

const PhotoCard = ({ photo, onClick }: PhotoCardProps) => {
  return (
    // Role is applied only when clickable so assistive tech gets accurate semantics.
    <article className="card photo-card" onClick={onClick} role={onClick ? "button" : undefined}>
      <img src={photo.thumbUrl} alt={photo.title} loading="lazy" />
      <div className="card-body">
        <h3>{photo.title}</h3>
        {photo.description ? <p>{photo.description}</p> : null}
        <div className="tag-row">
          {photo.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
};

export default PhotoCard;
