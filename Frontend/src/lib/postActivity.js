import axios from "axios";

const API_BASE = "https://hrms-software-for-ai-knots-it-solution.onrender.com";

export const postActivity = async ({
  token,
  actor,
  action,
  type = "general",
  meta = {},
}) => {
  if (!token) return;
  try {
    const payload = { actor, action, type, meta };
    await axios.post(`${API_BASE}/api/activities`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    // non-fatal — log for developers
    console.warn("postActivity failed", e?.response?.data || e.message || e);
  }
};
