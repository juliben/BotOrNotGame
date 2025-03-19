import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { useNavigate } from "react-router-dom";
import supabase from "@/api/supabase";
import { AnimatePresence, motion } from "motion/react";

const Homepage = () => {
  const navigate = useNavigate();
  const [onlinePlayers, setOnlinePlayers] = useState(0);

  const handleStart = async () => {
    navigate("/choose-name");
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
    <motion.div className="flex flex-1 flex-col px-4 justify-center items-center gap-7 mt-20 font-jersey text-2xl text-center">
      <motion.div // Pulsating effect
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: [1, 1.01, 1], opacity: [1, 0.95, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-5 left-5 text-[var(--text-accent)]"
      >
        <motion.div // Glitchy effect
          animate={{}}
          transition={{
            duration: 3,
            repeat: Infinity,
            times: [0, 0.6, 0.61, 0.7, 0.71, 0.8],
          }}
        >
          Online: {onlinePlayers}
        </motion.div>
      </motion.div>
      <motion.div // Pulsating animation
        animate={{ scale: [1, 1.01, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-5 left-5  blur-sm  "
      >
        <motion.div // Glitchy animation
          initial={{ color: "#39d4b7" }}
          animate={{
            color: [
              "#39d4b7",
              "#808080",
              "#39d4b7",
              "#808080",
              "#39d4b7",
              "#808080",
              "#39d4b7",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            times: [0, 0.6, 0.61, 0.7, 0.71, 0.8, 0.85],
            ease: "linear",
          }}
        >
          Online: {onlinePlayers}
        </motion.div>
      </motion.div>
      <div
        className={
          "bg-[var(--gradient)] h-full w-full rounded-full absolute -z-1 blur-3xl opacity-75"
        }
      />
      <p>3 humans, 1 AI.</p>
      <p>If the AI is voted out, all humans win.</p>
      <p>If a human is voted out, that human alone wins.</p>
      <p>Your goal: convince others you're the AI.</p>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button variant="default" className="w-fit" onClick={handleStart}>
          <p className={"text-2xl"}>PLAY WITH FRIENDS</p>
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button variant="default" className="w-fit" onClick={handleStart}>
          <p className={"text-2xl"}> PLAY WITH STRANGERS</p>
        </Button>
      </motion.div>
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
    </motion.div>
  );
};

export default Homepage;
