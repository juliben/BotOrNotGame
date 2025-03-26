import supabase from "../api/supabase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInAnonymously } from "@/api/supabaseAuth";

import { Gradient, Input, Checkbox, Card } from "./../components/ui";
import { DiceButton } from "./../components/DiceButton";
import { Label } from "@radix-ui/react-label";
import { useAvatar, useGetName } from "@/services/hooks/";

const ChooseName = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const { avatarUrl, randomAvatarNumber, roll } = useAvatar();
  const { name, getName, setName } = useGetName();

  // When ready, sign in as anon and update table with data
  const handleReady = async () => {
    setReady(true);
    const userId = await signInAnonymously();

    const { error } = await supabase
      .from("players")
      .update([
        {
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

  return (
    <div className="container">
      <Gradient />
      <Card>
        <p>Create your character:</p>
        <div className={"flex row gap-3 justify-center w-full px-5   "}>
          <Input
            type="text"
            className="text-2xl md:text-2xl lg:text-2xl sm:w-1/2 md:w-1/2 lg:w-1/2"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <DiceButton onClick={getName} />
        </div>
        <div className={"flex flex-row justify-center items-center gap-3"}>
          <img
            src={avatarUrl}
            className={"flex w-14 h-14 rounded-full border ring-border"}
          />
          <DiceButton onClick={roll} />
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
      </Card>
    </div>
  );
};

export default ChooseName;
