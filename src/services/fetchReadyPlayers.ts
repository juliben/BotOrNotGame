import supabase from "@/api/supabase";
import { AI_USER_ID } from "../../constants";

// Fetch the current count of ready players in the room
export const fetchReadyPlayers = async (roomId) => {
  const { data, count, error } = await supabase
    .from("players")
    .select("*", { count: "exact" })
    .or(`room_id.eq.${roomId},user_id.eq.${AI_USER_ID}`)
    .eq("is_online", true)
    .eq("is_ready", true);

  if (error) {
    console.log("Error fetching ready players:", error);
  }

  return { data, count };
};
