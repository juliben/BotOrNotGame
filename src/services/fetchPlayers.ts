import supabase from "../api/supabase";
import { User } from "../../types";

export const fetchPlayers = async (roomId: string | undefined) => {
  const { data, error } = await supabase
    .from("players")
    .select("user_id, game_name, avatar, is_ai, number")
    .eq("room_id", roomId)
    .eq("is_online", true);

  if (error) {
    console.log("Error fetching players:", error);
  }

  if (!data) {
    return;
  }

  const playersMap = data.reduce(
    (acc: Record<string, Partial<User>>, player) => {
      acc[player.user_id] = player;
      return acc;
    },
    {}
  );

  // Returning playersMap object
  return playersMap;
};
