import { useState } from "react";
import { generateRandomName } from "../index";

export const useGetName = () => {
  const [name, setName] = useState("");

  const getName = () => {
    const randomName = generateRandomName();
    setName(randomName);
    return randomName;
  };

  return { name, getName, setName };
};
