import { OnlineCount } from "./../components/OnlineCount";
import { useFetchOnline } from "@/services/hooks/";
import { Button } from "@/components/ui/button";

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

const Homepage = () => {
  const navigate = useNavigate();
  const onlinePlayers = useFetchOnline();

  return (
    <motion.div className="flex flex-1 flex-col px-4 justify-center items-center gap-7 pt-20 font-jersey text-2xl text-center">
      <OnlineCount onlinePlayers={onlinePlayers} />
      <div
        className={
          "bg-[var(--gradient)] h-screen w-screen  rounded-full absolute -z-1 blur-3xl opacity-75"
        }
        style={{
          height:
            "calc(100vh + env(safe-area-inset-top) + env(safe-area-inset-bottom))",
          width: "100vw",
        }}
      />
      <p>3 humans, 1 AI.</p>
      <p>If the AI is voted out, all humans win.</p>
      <p>If a human is voted out, that human alone wins.</p>
      <p>Your goal: convince others you're the AI.</p>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="default"
          className="w-fit"
          onClick={() => navigate("/choose-name")}
        >
          <p className={"text-2xl"}>PLAY WITH FRIENDS</p>
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="default"
          className="w-fit"
          onClick={() => navigate("/choose-name")}
        >
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
