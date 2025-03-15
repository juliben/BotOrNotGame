import supabase from "../api/supabase";

export const ping = async (userId) => {
  const { error } = await supabase
    .from("players")
    .update({ last_seen: new Date().toISOString(), is_online: true })
    .eq("user_id", userId);
  if (error) {
    console.error("Error pinging online status:", error);
  }
};
