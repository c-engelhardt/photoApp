// Root layout and route tree, plus app-wide auth context state.
import { createContext, useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { getMe, logout } from "./api/client";
import type { User } from "./api/types";
import Gallery from "./routes/Gallery";
import Login from "./routes/Login";
import PhotoDetail from "./routes/PhotoDetail";
import AlbumDetail from "./routes/AlbumDetail";
import AdminUpload from "./routes/AdminUpload";
import InviteAccept from "./routes/InviteAccept";
import Share from "./routes/Share";

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => undefined
});

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Bootstrap auth state from the existing session cookie on initial load.
    getMe()
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    // Redirect to login so protected pages do not remain visible after sign-out.
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div className="app">
        <header className="topbar">
          <Link to="/gallery" className="brand">
            PhotoApp
          </Link>
          <nav>
            <Link to="/gallery">Gallery</Link>
            {user?.role === "ADMIN" ? <Link to="/admin/upload">Upload</Link> : null}
          </nav>
          <div className="auth-actions">
            {user ? (
              <button className="ghost" onClick={handleLogout}>
                Log out
              </button>
            ) : (
              <Link to="/login" className="ghost">
                Log in
              </Link>
            )}
          </div>
        </header>

        <main className="page">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            // Route rendering waits for auth bootstrap to avoid flicker.
            <Routes>
              <Route path="/" element={<Gallery />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/photo/:id" element={<PhotoDetail />} />
              <Route path="/albums/:id" element={<AlbumDetail />} />
              <Route path="/admin/upload" element={<AdminUpload />} />
              <Route path="/login" element={<Login />} />
              <Route path="/invite/accept" element={<InviteAccept />} />
              <Route path="/share/:token" element={<Share />} />
            </Routes>
          )}
        </main>
      </div>
    </AuthContext.Provider>
  );
};

export default App;
