import supabase from "@/api/supabase";

// Fetch the current count of ready players in the room
export const fetchReadyPlayers = async (roomId: string) => {
  const { count, error } = await supabase
    .from("players")
    .select("*", { count: "exact" })
    .eq("room_id", Number(roomId))
    .eq("is_online", true)
    .eq("is_ready", true);

  if (error) {
    console.log("Error fetching ready players:", error);
  }

  return count;
};
