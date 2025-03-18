import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@radix-ui/react-label";
import axios from "axios";
import { AnimatePresence, motion, useAnimation } from "motion/react";

// import cutePortrait from "../assets/avatars/Cute-portraits_01.png";
import { IoDice } from "react-icons/io5";

import { useNavigate } from "react-router-dom";
import supabase from "../api/supabase";
import { getUserId } from "@/services/getUserId";
import { ping } from "@/services/ping";

const ChooseName = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
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

  const avatarUrl = `../../public/avatars/Cute-portraits_${randomAvatarNumber}.png`;

  const handleReady = async () => {
    const userId = await getUserId();

    const { error } = await supabase
      .from("players")
      .update([{ is_ready: !ready, game_name: name }])
      .eq("user_id", userId);
    if (error) {
      console.log("Error updating player:", error);
    }
    console.log("Set ready state to:", !ready);
    setReady(!ready);
  };

  const generateName = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/name");
      console.log(response.data.name);
      return response.data.name;
    } catch {
      console.log("Error generating name");
    } finally {
      setLoading(false);
    }
  };

  const getFirstName = (input: string) => {
    const prefixes = [
      "Male Human Name:",
      "Female Human Name:",
      "Male Dwarf Name:",
      "Female Dwarf Name:",
      "Male Elf Name:",
      "Female Elf Name:",
      "Male Hobbit Name:",
      "Female Hobbit Name:",
      "Male Orc Name:",
      "Female Orc Name:",
      "Male Gnome Name:",
      "Female Gnome Name:",
    ];
    let namePart = input;

    prefixes.forEach((prefix) => {
      if (namePart.startsWith(prefix)) {
        namePart = namePart.replace(prefix, "").trim();
      }
    });
    return namePart.split(" ")[0];
  };

  const handleGenerateName = async () => {
    const generatedName = await generateName();
    setName(getFirstName(generatedName));
  };

  const [isVisible, setIsVisible] = useState(true);

  const handleSet = () => {
    setReady(true);
    setTimeout(() => setIsVisible((prev) => !prev), 500);
  };

  return (
    <div className="flex flex-col flex-1 p-4 px-6 justify-center items-center gap-5 mt-20 font-jersey text-2xl text-center">
      <Button
        variant="ghost"
        onClick={() => {
          setIsVisible(!isVisible);
        }}
      ></Button>
      <div className="bg-[var(--gradient)] h-full w-full rounded-full absolute -z-1 blur-3xl opacity-50 top-0 left-0" />
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            initial={{ translateX: 400, rotate: 10, opacity: 0.5 }}
            animate={{ translateX: 0, rotate: 0, opacity: 1 }}
            exit={{ translateX: -400, rotate: -10, opacity: 0.5 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col py-15 md:w-2/3 lg:w-1/2 flex-1 items-center justify-center h-2/3 w-full p-4 gap-7 border-2 rounded-xl bg-[#353b85] shadow-lg"
          >
            <p>Choose a name:</p>
            <div className={"flex row gap-3 justify-center w-full px-5   "}>
              <Input
                type="text"
                className="text-2xl md:text-2xl lg:text-2xl sm:w-1/2 md:w-1/2 lg:w-1/2"
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                onClick={handleGenerateName}
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
                className={"flex w-13 h-13 rounded-full border-1 ring-border"}
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
                onCheckedChange={() => handleSet()}
                disabled={name === ""}
              />
              <Label className={name === "" ? "text-muted-foreground" : ""}>
                I'm ready
              </Label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChooseName;
