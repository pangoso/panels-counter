import React, { useState } from "react";

interface ColorDefinition {
  color: string;
  label: string;
}

export default function RightPanel({
  colors,
  onChangeLabel,
  generateCSVReport,
}: {
  colors: ColorDefinition[];
  onChangeLabel: (color: string, newName: string) => void;
  generateCSVReport: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`
        fixed top-0 right-0 h-full 
        flex flex-row items-start
        transition-transform duration-300
        z-40
        ${open ? "translate-x-0" : "translate-x-[calc(100%_-_48px)]"}
      `}
      style={{ pointerEvents: "auto" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="
          h-12 w-12 flex items-center justify-center
          bg-gray-800 text-white border-l border-t border-b border-gray-600
          rounded-l-lg shadow-xl
          mt-20
        "
      >
        {!open ? "<" : ">"}
      </button>

      <div
        className="
          w-64 h-full bg-gray-900 
          border-l border-gray-700 shadow-2xl 
          p-4 overflow-y-auto
        "
      >
        <h2 className="text-xl font-semibold mb-4">Color Labels</h2>
        <div className="flex flex-col gap-4">
          {colors.map((c) => (
            <div key={c.color} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border border-gray-500"
                style={{ backgroundColor: c.color }}
              ></div>

              <input
                type="text"
                value={c.label}
                onChange={(e) => onChangeLabel(c.color, e.target.value)}
                className="
                  flex-1 px-2 py-1 
                  bg-gray-700 text-gray-100 
                  rounded border border-gray-600
                "
              />
            </div>
          ))}
        </div>

        <button
          onClick={generateCSVReport}
          className="mt-4 px-3 py-2 bg-blue-600 rounded text-white w-full font-semibold hover:bg-blue-700"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}
