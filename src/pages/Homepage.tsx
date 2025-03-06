import { Button } from "@/components/ui/button";
import { signInAnonymously } from "@/api/supabaseAuth";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="flex flex-col p-4 justify-center items-center gap-5 mt-20">
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
      <Button variant="outline" className="w-fit ">
        LEADERBOARD
      </Button>
    </div>
  );
};

export default Homepage;
