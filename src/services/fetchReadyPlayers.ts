import supabase from "@/api/supabase";

// Fetch the current count of ready players in the room
export const fetchReadyPlayers = async (roomId) => {
  const { count, error } = await supabase
    .from("players")
    .select("*", { count: "exact" })
    .eq("room_id", roomId)
    .eq("is_ready", true)
    .eq("is_online", true);

  if (error) {
    console.log("Error fetching ready players:", error);
  }

  return count;
};
