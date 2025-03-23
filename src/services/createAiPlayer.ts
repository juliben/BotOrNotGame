import { AI_USER_ID } from "../../constants";
import axios from "axios";
import supabase from "../api/supabase";
import { getFirstName } from "./getFirstName";

// Create AI player in the player's table (number comes later)
export const createAiPlayer = async (roomId) => {
  try {
    console.log("Generating name for AI...");
    const response = await axios.get("http://localhost:3000/name");

    const generatedName = response.data.name;
    const firstName = getFirstName(generatedName);

    const randomNumber = Math.floor(Math.random() * 76) + 1;
    const number = String(randomNumber).padStart(2, "0");

    const { data, error } = await supabase.from("players").insert([
      {
        game_name: firstName,
        avatar: number,
        is_ai: true,
        room_id: roomId,
        is_ready: true,
      },
    ]);

    if (error) {
      console.log("Error updating AI's name in Supabase:", error);
    }

    return data;
  } catch {
    console.log("Error generating name");
  }
};
