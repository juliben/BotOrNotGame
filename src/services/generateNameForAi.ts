import { AI_USER_ID } from "../../constants";
import axios from "axios";
import supabase from "../api/supabase";
import { getFirstName } from "./getFirstName";

// Generates name and avatar for the AI
export const generateNameForAi = async () => {
  try {
    console.log("Generating name for AI...");
    const response = await axios.get("http://localhost:3000/name");

    const generatedName = response.data.name;
    const firstName = getFirstName(generatedName);

    const randomNumber = Math.floor(Math.random() * 76) + 1;
    const number = String(randomNumber).padStart(2, "0");

    const { error } = await supabase
      .from("players")
      .update({ game_name: firstName, avatar: number })
      .eq("user_id", AI_USER_ID);

    if (error) {
      console.log("Error updating AI's name in Supabase:", error);
    }
    return firstName;
  } catch {
    console.log("Error generating name");
  }
};
