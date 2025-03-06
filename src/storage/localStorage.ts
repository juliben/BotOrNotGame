import supabase from "../api/supabase";

// storage keys: userId,

export const getUserId = async () => {
  try {
    const userId = await localStorage.getItem("userId");
    if (!userId) {
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
    }
    console.log("Retrieved user ID from local storage:", userId);
    return userId;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return { error };
  }
};

export const logOut = async () => {
  await localStorage.removeItem("userId");
  const { error } = await supabase.auth.signOut();
  return { error };
};
