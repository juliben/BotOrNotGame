import { useAnimate } from "motion/react";

const TestScreen2 = () => {
  const [scope, animate] = useAnimate();

  const handleAnimate = async () => {
    await animate("#target", { opacity: [0, 1] });
    await animate("#target", { scale: [1.2, 1] });
    await animate("#target", { rotate: [0, 360] });
    await animate("#target2", { opacity: [0, 1], rotate: [0, 360] });
    await animate("#target2", { y: [0, -100, 0] });
  };

  return (
    <div
      ref={scope}
      className="bg-[#D96C7B] h-screen flex items-center justify-around pt-50 px-15"
    >
      <div id="target" className="bg-[#8B0051] w-[100px] h-[180px] " />
      <div id="target2" className="bg-[#8B0051] w-[100px] h-[180px] " />
      <div className="bg-[#8B0051] w-[100px] h-[180px] " />
      <button
        onClick={handleAnimate}
        className="border-2 border-dotted p-2 rounded-md text-black"
      >
        Trigger
      </button>
    </div>
  );
};

export default TestScreen2;
