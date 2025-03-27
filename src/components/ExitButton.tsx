interface Props {
  onClick: () => void;
  children: React.ReactNode;
}

export const ExitButton = ({ onClick, children }: Props) => {
  return (
    <div
      onClick={onClick}
      className={
        "bg-red-600 font-press-start text-xs rounded-lg flex justify-center items-center px-2 py-1 border-1 shadow-sm hover:bg-red-400"
      }
    >
      {children}
    </div>
  );
};
