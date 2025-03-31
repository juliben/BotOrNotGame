import supabase from "../api/supabase";
import { generateRandomName } from "./generateRandomName";

// Create AI player in the player's table (number comes later)
export const createAiPlayer = async (roomId: string) => {
  try {
    const name = generateRandomName();
    const randomNumber = Math.floor(Math.random() * 76) + 1;
    const number = String(randomNumber).padStart(2, "0");

    const { data, error } = await supabase
      .from("players")
      .insert([
        {
          game_name: name,
          avatar: number,
          is_ai: true,
          room_id: roomId,
        },
      ])
      .select("user_id")
      .single();
    if (error) {
      console.log("Error updating AI's name in Supabase:", error);
      return null;
    }

    return data;
  } catch {
    console.log("Error generating name");
    return null;
  }
};
