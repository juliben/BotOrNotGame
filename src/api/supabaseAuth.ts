import supabase from "./supabase";

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signInAnonymously = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.signInAnonymously();
  if (error) {
    console.log("Error signing in anonymously:", error);
  }
  if (user) {
    const { error } = await supabase
      .from("players")
      .insert({ user_id: user.id });
    if (error) {
      console.log("Error inserting player:", error);
    }
    return user.id;
  }
};

export const logOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};
