import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@radix-ui/react-label";
import { Icons } from "@/components/ui/spinner";

import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const navigate = useNavigate();
  const [waiting, setWaiting] = useState(true);
  const [count, setCount] = useState(5);

  useEffect(() => {
    let countdownTimer;

    if (!waiting) {
      countdownTimer = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount <= 1) {
            clearInterval(countdownTimer);
            navigate("/room");
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    return () => clearInterval(countdownTimer);
  }, [waiting, navigate]);

  return (
    <div className="flex flex-col p-4 justify-center items-center gap-5 mt-20">
      <p>Waiting for humans...0/3</p>
      {waiting && <Icons.spinner className="h-4 w-4 animate-spin" />}
      {!waiting && <p>Starting in {count}...</p>}
      <p>Choose a name:</p>
      <Input type="text" className="w-2/3" maxLength={20} />
      <Button>Generate name</Button>
      <div className="flex flex-row justify-center items-center gap-2">
        <Checkbox />
        <Label>Ready</Label>
      </div>
    </div>
  );
};

export default Lobby;
