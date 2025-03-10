import { AI_USER_ID } from "../../constants";
import axios from "axios";
import supabase from "../api/supabase";
import { getFirstName } from "./getFirstName";

export const generateNameForAi = async () => {
  try {
    console.log("Generating name for AI...");
    const response = await axios.get("http://localhost:3000/name");

    const generatedName = response.data.name;
    const firstName = getFirstName(generatedName);

    const { error } = await supabase
      .from("players")
      .update({ game_name: firstName })
      .eq("user_id", AI_USER_ID);

    if (error) {
      console.log("Error updating AI's name in Supabase:", error);
    }
    console.log("Updated AI's name in Supabase:" + firstName);
  } catch {
    console.log("Error generating name");
  }
};
