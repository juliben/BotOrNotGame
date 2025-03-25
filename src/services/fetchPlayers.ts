import supabase from "../api/supabase";
import { User } from "../../types";

type Props = {
  roomId: string;
};

export const fetchPlayers = async ({ roomId }: Props) => {
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

  const players = data.reduce((acc: Record<string, Partial<User>>, player) => {
    acc[player.user_id] = player;
    return acc;
  }, {});

  // Returning playersMap object
  return players;
};
