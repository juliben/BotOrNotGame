import supabase from "@/api/supabase";

// Fetch the current count of ready players in the room
export const fetchReadyPlayers = async (roomId) => {
  if (roomId === null) {
    console.log("Room ID not available yet.");
    return;
  }
  const { data, count, error } = await supabase
    .from("players")
    .select("*", { count: "exact" })
    .eq("room_id", roomId)
    .eq("is_online", true)
    .eq("is_ready", true);

  if (error) {
    console.log("Error fetching ready players:", error);
  }

  return { data, count };
};
