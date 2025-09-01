"use client";
type Props = { current: 1 | 2 | 3 };

export default function Stepper({ current }: Props) {
  const steps = [1,2,3] as const;
  return (
    <div className="flex items-center gap-4 my-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`h-10 w-10 flex items-center justify-center rounded-full border
            ${current >= s ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-300"}`}>
            {s}
          </div>
          {i < steps.length - 1 && <div className="w-10 h-[2px] bg-gray-300 mx-2" />}
        </div>
      ))}
    </div>
  );
}
