// Main browsing page with albums, photo search, tag filtering, and pagination.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAlbums, fetchPhotos, fetchTags } from "../api/client";
import type { AlbumListItem, PhotoListItem } from "../api/types";
import AlbumGrid from "../components/AlbumGrid";
import GalleryGrid from "../components/GalleryGrid";
import TagFilter from "../components/TagFilter";

const Gallery = () => {
  const [photos, setPhotos] = useState<PhotoListItem[]>([]);
  const [albums, setAlbums] = useState<AlbumListItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Albums and tag metadata are relatively static, so load once on mount.
    fetchAlbums().then((data) => setAlbums(data.items)).catch(() => setAlbums([]));
    fetchTags().then((data) => setTags(data.items)).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    // Photo list reloads whenever paging or filter inputs change.
    setLoading(true);
    fetchPhotos({ page, q: search, tag: selectedTag })
      .then((data) => {
        setPhotos(data.items);
        setTotal(data.total);
      })
      .catch(() => {
        setPhotos([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, search, selectedTag]);

  // Backend defaults to 24 photos per page in this route.
  const totalPages = useMemo(() => Math.ceil(total / 24), [total]);

  return (
    <section className="stack">
      <div className="headline">
        <div>
          <h2>Gallery</h2>
          <p className="muted">Browse albums and recent uploads.</p>
        </div>
        <div className="search">
          <input
            type="search"
            placeholder="Search photos"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div>
        <h3>Albums</h3>
        <AlbumGrid albums={albums} onSelect={(id) => navigate(`/albums/${id}`)} />
      </div>

      <div>
        <h3>Photos</h3>
        <TagFilter
          tags={tags}
          value={selectedTag}
          onChange={(tag) => {
            setSelectedTag(tag);
            setPage(1);
          }}
        />
        {loading ? (
          <div className="loading">Loading photos...</div>
        ) : (
          <GalleryGrid photos={photos} onSelect={(id) => navigate(`/photo/${id}`)} />
        )}
        <div className="pager">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
            disabled={page >= (totalPages || 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
