import supabase from "../api/supabase";

export const getUserId = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.log("Error getting user ID:", error);
    }
    if (data.user) {
      return data.user.id;
    }
  } catch {
    console.error("Error getting user ID:", error);
  }
};
