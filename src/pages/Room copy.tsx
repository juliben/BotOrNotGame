import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import supabase from "../api/supabase";
import { shuffle } from "lodash";
import flipCoin from "@/services/flipCoin.ts";

import { getUserId } from "@/services/getUserId.ts";
import { fetchParticipants } from "@/services/fetchParticipants.ts";
import { fetchParticipantNames } from "@/services/fetchParticipantNames.ts";
import { AI_USER_ID } from "../../constants.ts";
import axios from "axios";
import { ping } from "@/services/ping.ts";
import { processVotes } from "@/services/processVotes.ts";
import { getFirstMessageFromAi } from "@/services/getFirstMessageFromAi.ts";
import { useAnimate, motion } from "motion/react";

const Room2 = () => {
  const [winnerScreenVisible, setWinnerScreenVisible] = useState(false);
  const [scope, animate] = useAnimate();
  const [animationStep2, setAnimationStep2] = useState(false);

  const playerNameStyles = {
    1: "text-[#99CCFF] ", // Light blue for player 1
    2: "text-[#66FF66] ", // Light green for player 2
    3: "text-[#FF6666] ", // Light red for player 3
    4: "text-[#CC99CC] ", // Light purple for player 4
  };
  const playerVoteStyles = {
    1: "text-[#0066CC] font-medium", // Light blue for player 1
    2: "text-[#006600] font-medium", // Light green for player 2
    3: "text-[#990000] font-medium", // Light red for player 3
    4: "text-[#660066] font-medium", // Light purple for player 4
  };
  const messageBubbleStyles = {
    1: "bg-[#0066CC] text-white", // Dark blue for player 1
    2: "bg-[#006600] text-white", // Dark green for player 2
    3: "bg-[#990000] text-white", // Dark red for player 3
    4: "bg-[#660066] text-white", // Dark purple for player 4
  };

  return (
    <div
      className={`flex flex-col p-4 min-h-dvh max-h-dvh bg-[#353b85] flex items-center`}
    >
      <button
        onClick={() => setWinnerScreenVisible(true)}
        className=" p-2 rounded-md bg-pink-200 w-1/4 mt-10 text-black"
      >
        Set
      </button>
      {winnerScreenVisible && !animationStep2 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          onClick={() => {
            setWinnerScreenVisible(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
        >
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl   p-8 font-press-start ">
            <motion.p
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -50 }}
              transition={{ duration: 1, ease: "linear" }}
            >
              The chat voted for...
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [1], y: -50 }}
              transition={{
                duration: 1,
                ease: "linear",
                delay: 0.75,
              }}
              className="flex items-center flex-col gap-4"
            >
              <motion.img
                animate={{ rotateY: [0, 1080] }}
                transition={{ delay: 0.75, duration: 1.5, ease: "linear" }}
                onAnimationComplete={() => {
                  setAnimationStep2(true);
                }}
                src={`/avatars/Cute-portraits_05.png`}
                alt="Winner's avatar"
                className="w-16 h-16 rounded-full ring-4 shadow-md mt-3"
              />
              <p id="winner_name" className="text-xl">
                Arkansas
              </p>
            </motion.div>

            {/* <h1 className="text-3xl text-center text-red-400">
              {winner.user_id === AI_USER_ID && "HUMANS WIN!"}
              {winner.user_id !== AI_USER_ID && "HUMANS LOSE!"}
            <h1>  */}
          </div>
        </motion.button>
      )}

      {winnerScreenVisible && animationStep2 && (
        <button
          onClick={() => {
            {
              setWinnerScreenVisible(false);
              setAnimationStep2(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 "
        >
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl   p-8 font-press-start">
            <motion.p
              initial={{ y: 0 }}
              animate={{ opacity: 0, y: -100 }}
              transition={{ duration: 1, ease: "linear" }}
            >
              The chat voted for...
            </motion.p>
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ y: -120 }}
              transition={{
                duration: 1,
                ease: "linear",
                // delay: 0.75,
              }}
              className="flex items-center flex-col gap-4"
            >
              <motion.img
                src={`/avatars/Cute-portraits_05.png`}
                alt="Winner's avatar"
                className="w-16 h-16 rounded-full ring-4 shadow-md mt-3"
              />
              <p className="text-xl">Arkansas</p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0, 1, 0, 1],
                }}
                transition={{
                  delay: 1.75,
                  ease: "linear",
                  times: [0, 0.1, 0.2, 0.3, 0.4, 1],
                }}
                className="text-red-400"
              >
                NOT AN AI
              </motion.p>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -100 }}
              transition={{ delay: 2.75, duration: 0.25, ease: "linear" }}
              onAnimationComplete={() => {
                setTimeout(() => {
                  setWinnerScreenVisible(false);
                }, 3000);
              }}
              className="text-xl  text-center text-red-400"
            >
              HUMANS LOSE!
            </motion.h1>
          </div>
        </button>
      )}
    </div>
  );
};

export default Room2;
