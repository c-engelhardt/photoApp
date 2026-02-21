// Admin-only form for uploading photos and attaching metadata.
import { FormEvent, useContext, useEffect, useState } from "react";
import { fetchAlbums, uploadPhoto } from "../api/client";
import type { AlbumListItem } from "../api/types";
import { AuthContext } from "../App";

const AdminUpload = () => {
  const { user } = useContext(AuthContext);
  const [albums, setAlbums] = useState<AlbumListItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAlbums().then((data) => setAlbums(data.items)).catch(() => setAlbums([]));
  }, []);

  // Route remains mounted for all users, so enforce role in the component.
  if (user?.role !== "ADMIN") {
    return <div className="panel">Admins only.</div>;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setStatus("Please select a file");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      // FormData mirrors backend multipart field names exactly.
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (description) formData.append("description", description);
      if (tags) formData.append("tags", tags);
      if (albumId) formData.append("albumId", albumId);
      formData.append("visibility", visibility);

      await uploadPhoto(formData);
      setStatus("Upload complete.");
      setFile(null);
      setTitle("");
      setDescription("");
      setTags("");
      setAlbumId("");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Upload photo</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Photo file
          <input type="file" accept="image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Tags (comma separated)
          <input value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <label>
          Album
          <select value={albumId} onChange={(event) => setAlbumId(event.target.value)}>
            <option value="">None</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Visibility
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            <option value="PRIVATE">Private</option>
            <option value="SHARED">Shared</option>
          </select>
        </label>
        {status ? <p className="muted">{status}</p> : null}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </section>
  );
};

export default AdminUpload;
