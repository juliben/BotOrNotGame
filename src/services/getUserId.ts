import supabase from "../api/supabase";

export const getUserId = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.log("Error getting user ID:", error);
      return { error };
    }
    if (data.user) {
      await localStorage.setItem("userId", data.user.id);
      console.log("Fetched user ID from Supabase:", data.user.id);
      return data.user.id;
    }
  } catch {
    console.error("Error getting user ID:", error);
  }
};
