import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@radix-ui/react-label";
import axios from "axios";
import { motion } from "motion/react";

import { names, spanishNames } from "../../constants.ts";

// import cutePortrait from "../assets/avatars/Cute-portraits_01.png";
import { IoDice } from "react-icons/io5";

import { useNavigate } from "react-router-dom";
import supabase from "../api/supabase";
import { signInAnonymously } from "@/api/supabaseAuth";

const ChooseName = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const [randomAvatarNumber, setRandomAvatarNumber] = useState<string | null>(
    null
  );

  // Avatar randomizer

  const randomizer = () => {
    const random = Math.floor(Math.random() * 76) + 1;
    const number = String(random).padStart(2, "0");
    setRandomAvatarNumber(number);
  };

  useEffect(() => {
    randomizer();
  }, []);

  const avatarUrl = `/avatars/Cute-portraits_${randomAvatarNumber}.png`;

  // When ready, sign in as anon and update table with data
  const handleReady = async () => {
    setReady(true);
    const userId = await signInAnonymously();

    const { error } = await supabase
      .from("players")
      .update([
        {
          is_ready: true,
          game_name: name,
          avatar: randomAvatarNumber,
          is_online: true,
        },
      ])
      .eq("user_id", userId);
    if (error) {
      console.log("Error updating player:", error);
    }

    navigate("/lobby/" + userId);
  };

  const getName = () => {
    const randomName = names[Math.floor(Math.random() * names.length)];
    setName(randomName);
  };

  return (
    <div className="flex flex-col flex-1 p-4 px-6 justify-center items-center gap-5 mt-20 font-jersey text-2xl text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[var(--gradient)] h-full w-full rounded-full absolute -z-1 blur-3xl opacity-50 top-0 left-0"
      />

      <motion.div
        initial={{ translateX: 400, rotate: 10, opacity: 0.5 }}
        animate={{ translateX: 0, rotate: 0, opacity: 1 }}
        exit={{
          translateX: -400,
          rotate: -10,
          opacity: 0,
        }}
        transition={{ duration: 0.5 }}
        className="flex flex-col py-15 md:w-2/3 lg:w-1/2 flex-1 items-center justify-center h-2/3 w-full p-4 gap-7 border-2 rounded-xl bg-[#353b85] shadow-lg"
      >
        <p>Create your character:</p>
        <div className={"flex row gap-3 justify-center w-full px-5   "}>
          <Input
            type="text"
            className="text-2xl md:text-2xl lg:text-2xl sm:w-1/2 md:w-1/2 lg:w-1/2"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            onClick={getName}
            className="border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground rounded-md border bg-[#2c2971] shadow-xs transition-[color,box-shadow]"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: 360 }}
            >
              <IoDice className={"text-white rotate-12 size-5"} />
            </motion.div>
          </Button>
        </div>
        <div className={"flex flex-row justify-center items-center gap-3"}>
          <img
            src={avatarUrl}
            className={"flex w-14 h-14 rounded-full border ring-border"}
          />
          <Button
            onClick={() => randomizer()}
            className="border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground rounded-md border bg-[#2c2971] shadow-xs transition-[color,box-shadow]"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: 360 }}
            >
              <IoDice className={"text-white rotate-12 size-5"} />
            </motion.div>
          </Button>
        </div>

        <div className="flex flex-row justify-center items-center gap-2">
          <Checkbox
            checked={ready}
            onCheckedChange={handleReady}
            disabled={name === ""}
          />
          <Label className={name === "" ? "text-muted-foreground" : ""}>
            I'm ready
          </Label>
        </div>
      </motion.div>
    </div>
  );
};

export default ChooseName;
