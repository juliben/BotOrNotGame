import { OnlineCount } from "./../components";
import { useFetchOnline } from "@/services/hooks/";
import { Button } from "@/components/ui/button";

import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { sendMessagesToAi } from "../services";

const Homepage = () => {
  const navigate = useNavigate();
  const onlinePlayers = useFetchOnline();

  const handleNavigate = (privateRoom: boolean) => {
    navigate("/choose-name", { state: { privateRoom: privateRoom } });
  };

  const handleDebug = () => {
    const messages = [
      {
        role: "user",
        content: "¿A quien le gusta la polenta con salsa de tomate?",
      },
      { role: "user", content: "Se me pego una cancion japonesa kawaii" },
    ];
    const response = fetch(
      "https://silkyxpphpftgloncpls.functions.supabase.co/getAiMessageSpanish",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Required to indicate the body is JSON
        },
        body: JSON.stringify({ messages }),
      }
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Response data from backend:", data);
      })
      .catch((error) => {
        console.error("Error during fetch request:", error);
      });
    console.log(response);
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
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="default"
          className="w-fit"
          onClick={() => handleNavigate(false)}
        >
          <p className={"text-2xl"}>NEW GAME</p>
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="default"
          className="w-fit"
          onClick={() => handleDebug()}
        >
          <p className={"text-2xl"}>Debug</p>
        </Button>
      </motion.div>
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
      <button onClick={handleDebug}>
        <p className="text-sm mt-20">
          Made by:{" "}
          <Link
            to={"https://github.com/juliben"}
            className="text-ring underline"
          >
            juliben
          </Link>
        </p>
      </button>
    </motion.div>
  );
};

export default Homepage;
