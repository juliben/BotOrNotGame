import supabase from "@/api/supabase";
import { useState, useEffect } from "react";

export const useFetchOnline = () => {
  const [onlinePlayers, setOnlinePlayers] = useState(0);

  // Initial fetch of # of online players
  useEffect(() => {
    console.log("Fetching online players...");
    fetchOnlinePlayers();

    const interval = setInterval(() => {
      fetchOnlinePlayers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchOnlinePlayers = async () => {
    const { data, error } = await supabase
      .from("players")
      .select("is_online")
      .eq("is_online", true)
      .eq("is_ai", false);
    if (error) {
      console.error("Error fetching online players:", error);
    }
    if (!data) {
      return;
    }
    setOnlinePlayers(data.length);
  };

  return onlinePlayers;
};

// export default useFetchOnline;
