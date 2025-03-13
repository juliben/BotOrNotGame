import { Button } from "@/components/ui/button";
import { signInAnonymously } from "@/api/supabaseAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import supabase from "@/api/supabase";
import { useEffect } from "react";

const Homepage = () => {
  const navigate = useNavigate();

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

  // Subscribe to online updates
  useEffect(() => {
    const channel = supabase
      .channel("players_db_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
        },
        (payload) => {
          console.log("Change received:", payload);
        }
      )
      .subscribe((status) => {
        console.log("Channel status:", status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col p-4 justify-center items-center gap-5 mt-20">
      <p className="absolute top-5 left-5 ">Online: 1</p>
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
      <Button variant="secondary" className="w-fit">
        SIGN IN / REGISTER
      </Button>
      <Button variant="outline" className="w-fit">
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
