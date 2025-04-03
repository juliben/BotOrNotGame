import { NewGameButton, OnlineCount } from "./../components";
import { useFetchOnline } from "@/services/hooks/";
import { Analytics } from "@vercel/analytics/react";

import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

const Homepage = () => {
  const navigate = useNavigate();
  const onlinePlayers = useFetchOnline();

  const handleNavigate = (privateRoom: boolean) => {
    navigate("/choose-name", { state: { privateRoom: privateRoom } });
  };

  return (
    <motion.div className="flex-center flex-1 flex-col px-4 gap-7 pt-20 font-jersey text-2xl text-center">
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

      <NewGameButton onClick={() => handleNavigate(false)} />

      {/* <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="default"
          className="w-fit"
          onClick={() => handleNavigate(true)}
        >
          <p className={"text-2xl"}> PLAY WITH FRIENDS</p>
        </Button>
      </motion.div> */}
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
      <Analytics />
      <p className="text-sm mt-20">
        Made by:{" "}
        <Link to={"https://github.com/juliben"} className="text-ring underline">
          juliben
        </Link>
      </p>
    </motion.div>
  );
};

export default Homepage;
