import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@radix-ui/react-label";
import { Icons } from "@/components/ui/spinner";
import axios from "axios";
import { motion } from "motion/react";

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

  useEffect(() => {
    let pingInterval;

    if (!userId) {
      getUserId().then((id) => {
        setUserId(id);
      });
    }
    if (userId === null) {
      console.log("Ping: User ID not found");
      return;
    }
    console.log("Attempting to start pinging, userId:", userId);

    const startPinging = async () => {
      // Send initial ping
      ping(userId);

      console.log("Now pinging");

      // Send a ping every 30 seconds
      pingInterval = setInterval(ping, 30000);
    };

    startPinging();
    return () => {
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [userId]);

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

  return (
    <div className="flex flex-col flex-1 p-4 px-6 justify-center items-center gap-5 mt-20 font-jersey text-2xl text-center">
      <div className="bg-[var(--gradient)] h-full w-full rounded-full absolute -z-1 blur-3xl opacity-50" />
      <div className="flex flex-col py-15 md:w-2/3 lg:w-1/2 flex-1 items-center justify-center h-2/3 w-full p-4 gap-7 border-2 rounded-xl bg-[#353b85] shadow-lg">
        <p>Choose a name:</p>
        <div
          className={
            "flex row gap-3 justify-center w-full px-5 md:w-1/2 lg:w-1/2"
          }
        >
          <Input
            type="text"
            className="text-2xl md:text-2xl lg:text-2xl"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            onClick={handleGenerateName}
            className="border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground rounded-md border bg-[#2c2971] shadow-xs transition-[color,box-shadow]"
          >
            {/* NOW WORKING ON ROLLING DICE ANIMATION WHEN USING GENERATE NAME */}
            <motion.div>
              <IoDice className={"text-white"} />
            </motion.div>
          </Button>
        </div>
        <div className={"flex flex-row justify-center items-center gap-3"}>
          <div className={"bg-gray-400 w-13 h-13 rounded-full"} />
          <Button
            onClick={handleGenerateName}
            className="border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground rounded-md border bg-[#2c2971] shadow-xs transition-[color,box-shadow]"
          >
            <motion.div>
              <IoDice className={"text-white"} />
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
      </div>
    </div>
  );
};

export default ChooseName;
