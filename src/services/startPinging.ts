import { getUserId } from "./getUserId";
import supabase from "../api/supabase";

export const startPinging = async () => {
  const userId = await getUserId();
  let pingInterval;

  const ping = async () => {
    const { error } = await supabase
      .from("players")
      .update({ last_seen: new Date().toISOString(), is_online: true })
      .eq("user_id", userId);
    if (error) {
      console.error("Error pinging online status:", error);
    }
  };

  // Send initial ping
  ping();

  // Send a ping every 30 seconds
  pingInterval = setInterval(ping, 30000);
};
