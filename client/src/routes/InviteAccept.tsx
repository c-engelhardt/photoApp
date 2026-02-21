// Public invite redemption page that creates a viewer account.
import { FormEvent, useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { acceptInvite } from "../api/client";
import { AuthContext } from "../App";

const InviteAccept = () => {
  const [searchParams] = useSearchParams();
  // Invite token is delivered in query string by email link.
  const token = searchParams.get("token") ?? "";
  const { setUser } = useContext(AuthContext);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError("Invite token is missing");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await acceptInvite(token, password);
      // Accepted invites always create viewer accounts in current backend flow.
      setUser({ id: result.id, email: result.email, role: "VIEWER" });
      navigate("/gallery");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Accept invite</h2>
      <p className="muted">Choose a password to unlock the gallery.</p>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Finish"}
        </button>
      </form>
    </section>
  );
};

export default InviteAccept;
