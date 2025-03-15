import { Button } from "@/components/ui/button";
import { signInAnonymously } from "@/api/supabaseAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import supabase from "@/api/supabase";
import { useEffect, useState } from "react";

const Homepage = () => {
  const navigate = useNavigate();
  const [onlinePlayers, setOnlinePlayers] = useState(0);

  const handleSignInAnonymously = async () => {
    try {
      const userId = await signInAnonymously();
      console.log("User ID:", userId);
      localStorage.setItem("userId", userId);
      navigate("/lobby");
    } catch (error) {
      console.error("Authentication failed:", error);
      // Handle error
    }
  };

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
      .eq("is_online", true);
    if (error) {
      console.error("Error fetching online players:", error);
    } else {
      console.log("Online players:", data.length - 1);
    }

    if (!data) {
      return;
    }
    // (Minus 1 because 1 is the AI)
    setOnlinePlayers(data.length - 1);
  };

  return (
    <div className="flex flex-col p-4 justify-center items-center gap-5 mt-20">
      <p className="absolute top-5 left-5 ">Online: {onlinePlayers}</p>
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <p>3 humans, 1 AI.</p>
      <p>If the AI is voted out, all humans win.</p>
      <p>If a human is voted out, that human alone wins.</p>
      <p>Your goal: convince others you're the AI.</p>
      <Button
        variant="default"
        className="w-fit"
        onClick={handleSignInAnonymously}
      >
        PLAY AS A GUEST
      </Button>
      <Button variant="secondary" className="w-fit" disabled>
        SIGN IN / REGISTER
      </Button>
      <Button variant="outline" className="w-fit" disabled>
        LEADERBOARD
      </Button>
      {/* <Button
        variant="ghost"
        className={"absolute bottom-5 right-5 flex row  items-center gap-1"}
        onClick={() => {
          if (language === "en") {
            setLanguage("es");
          } else {
            setLanguage("en");
          }
        }}
      >
        ESPAÑOL
        <FaLongArrowAltRight />
      </Button> */}
    </div>
  );
};

export default Homepage;
