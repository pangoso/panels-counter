import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import RightPanel from "./RightPanel";

type Thickness = 20 | 30 | 40 | 50;

type SectionType = "whole" | "half-vertical" | "half-horizontal";

type Mark = {
  id: string;
  x: number;
  y: number;
  color: string;
  thickness?: Thickness | null;
  section: SectionType;
};

export default function Viewer() {
  const [showInput, setShowInput] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [addPointMode, setAddPointMode] = useState(false);
  const [pointColor, setPointColor] = useState("red");
  const [pointThickness, setPointThickness] = useState<Thickness | null>(null);
  const [pointSection, setPointSection] = useState<SectionType>("whole");

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [marks, setMarks] = useState<Mark[]>([]);

  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const dragData = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const [colorDefs, setColorDefs] = useState([
    { color: "red", label: "Red" },
    { color: "yellow", label: "Yellow" },
    { color: "green", label: "Green" },
    { color: "cyan", label: "Cyan" },
    { color: "magenta", label: "Magenta" },
    { color: "orange", label: "Orange" },
    { color: "blue", label: "Blue" },
    { color: "purple", label: "Purple" },
    { color: "teal", label: "Teal" },
    { color: "pink", label: "Pink" },
    { color: "gold", label: "Gold" },
    { color: "dodgerblue", label: "Dodger Blue" },
  ]);

  const darkTextColors = new Set(["pink", "gold", "yellow", "cyan", "orange"]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;

    if (
      fileType === "image/png" ||
      fileType === "image/jpg" ||
      fileType === "image/jpeg"
    ) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowInput(false);
      };
    }
  };

  const containerMaxHeight = showInput && imageSrc ? "82vh" : "92vh";

  const enableDrag = () => setDragEnabled((v) => !v);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragEnabled || addPointMode) return;

    const el = e.currentTarget;
    dragData.current.isDragging = true;
    dragData.current.startX = e.clientX;
    dragData.current.startY = e.clientY;
    dragData.current.scrollLeft = el.scrollLeft;
    dragData.current.scrollTop = el.scrollTop;

    el.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragEnabled || !dragData.current.isDragging) return;

    const el = e.currentTarget;
    const dx = e.clientX - dragData.current.startX;
    const dy = e.clientY - dragData.current.startY;

    el.scrollLeft = dragData.current.scrollLeft - dx;
    el.scrollTop = dragData.current.scrollTop - dy;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    dragData.current.isDragging = false;
    if (wrapperRef.current) wrapperRef.current.style.cursor = "grab";
  };

  const handleAddTickClick = (e: React.MouseEvent) => {
    if (!addPointMode || !imgRef.current) return;

    const img = imgRef.current;
    const rect = img.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const realX = clickX / zoom;
    const realY = clickY / zoom;

    setMarks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        x: realX,
        y: realY,
        color: pointColor,
        thickness: pointThickness ?? null,
        section: pointSection,
      },
    ]);
  };

  // const removeMark = (id: string) => {
  //   setMarks((prev) => prev.filter((t) => t.id !== id));
  // };

  const deleteSelected = () => {
    if (!selectedMarkId) return;

    setMarks((prev) => prev.filter((m) => m.id !== selectedMarkId));
    setSelectedMarkId(null);
  };

  const deleteAll = () => setMarks([]);

  const updateColorLabel = (color: string, newName: string) => {
    setColorDefs((prev) =>
      prev.map((c) => (c.color === color ? { ...c, label: newName } : c))
    );
  };

  const countMarks = () => {
    const counts: Record<
      string,
      {
        whole: number;
        halfVertical: number;
        halfHorizontal: number;
      }
    > = {};

    for (const m of marks) {
      const key = `${m.color}|${m.thickness ?? "none"}`;

      if (!counts[key]) {
        counts[key] = { whole: 0, halfVertical: 0, halfHorizontal: 0 };
      }

      const section = m.section ?? "whole";

      if (section === "whole") counts[key].whole++;
      else if (section === "half-vertical") counts[key].halfVertical++;
      else if (section === "half-horizontal") counts[key].halfHorizontal++;
    }

    return counts;
  };

  const generateCSVReport = () => {
    let csv =
      "No,Color Label,Thickness (mm),Whole,0.5 Vertical,0.5 Horizontal,Sum\n";

    const counts = countMarks();
    let row = 1;

    Object.entries(counts).forEach(([key, data]) => {
      const [color, thickness] = key.split("|");
      const label = colorDefs.find((c) => c.color === color)?.label ?? color;

      const sum =
        data.whole +
        Math.ceil(data.halfVertical / 2) +
        Math.ceil(data.halfHorizontal / 2);

      csv += `${row++},${label},${thickness === "none" ? "" : thickness},${
        data.whole
      },${data.halfVertical},${data.halfHorizontal},${sum}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "marks_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 flex flex-col items-center gap-6 text-gray-100">
      <RightPanel
        colors={colorDefs}
        onChangeLabel={updateColorLabel}
        generateCSVReport={generateCSVReport}
      />

      {showInput && (
        <div className="w-full max-w-xl p-6 shadow-2xl bg-gray-800 rounded-lg border border-gray-700">
          <input
            type="file"
            accept="image/png, image/jpg, image/jpeg"
            onChange={handleFile}
            className="border p-2 rounded w-full bg-gray-700 text-gray-100 border-gray-600"
          />
        </div>
      )}

      {imageSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-2 max-w-95vw mt-2"
          style={{ maxHeight: containerMaxHeight }}
        >
          <div className="flex gap-3 items-center mb-5">
            <button
              onClick={() => setShowInput((v) => !v)}
              className="px-3 py-2 bg-gray-700 rounded flex flex-row content-center justify-center font-semibold"
            >
              {!showInput ? (
                <svg
                  fill="#ffffff"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#ffffff"
                  width={18}
                  height={18}
                  style={{ marginRight: "5px", marginTop: "3px" }}
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M14 12c-1.095 0-2-.905-2-2 0-.354.103-.683.268-.973C12.178 9.02 12.092 9 12 9a3.02 3.02 0 0 0-3 3c0 1.642 1.358 3 3 3 1.641 0 3-1.358 3-3 0-.092-.02-.178-.027-.268-.29.165-.619.268-.973.268z"></path>
                    <path d="M12 5c-7.633 0-9.927 6.617-9.948 6.684L1.946 12l.105.316C2.073 12.383 4.367 19 12 19s9.927-6.617 9.948-6.684l.106-.316-.105-.316C21.927 11.617 19.633 5 12 5zm0 12c-5.351 0-7.424-3.846-7.926-5C4.578 10.842 6.652 7 12 7c5.351 0 7.424 3.846 7.926 5-.504 1.158-2.578 5-7.926 5z"></path>
                  </g>
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="#ffffff"
                  width={18}
                  height={18}
                  style={{ marginRight: "5px", marginTop: "3px" }}
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M3.61399 4.21063C3.17804 3.87156 2.54976 3.9501 2.21069 4.38604C1.87162 4.82199 1.95016 5.45027 2.38611 5.78934L4.66386 7.56093C3.78436 8.54531 3.03065 9.68043 2.41854 10.896L2.39686 10.9389C2.30554 11.1189 2.18764 11.3514 2.1349 11.6381C2.09295 11.8661 2.09295 12.1339 2.1349 12.3618C2.18764 12.6485 2.30554 12.881 2.39686 13.0611L2.41854 13.104C4.35823 16.956 7.71985 20 12.0001 20C14.2313 20 16.2129 19.1728 17.8736 17.8352L20.3861 19.7893C20.8221 20.1284 21.4503 20.0499 21.7894 19.6139C22.1285 19.178 22.0499 18.5497 21.614 18.2106L3.61399 4.21063ZM16.2411 16.5654L14.4434 15.1672C13.7676 15.6894 12.9201 16 12.0001 16C9.79092 16 8.00006 14.2091 8.00006 12C8.00006 11.4353 8.11706 10.898 8.32814 10.4109L6.24467 8.79044C5.46659 9.63971 4.77931 10.6547 4.20485 11.7955C4.17614 11.8525 4.15487 11.8948 4.13694 11.9316C4.12114 11.964 4.11132 11.9853 4.10491 12C4.11132 12.0147 4.12114 12.036 4.13694 12.0684C4.15487 12.1052 4.17614 12.1474 4.20485 12.2045C5.9597 15.6894 8.76726 18 12.0001 18C13.5314 18 14.9673 17.4815 16.2411 16.5654ZM10.0187 11.7258C10.0064 11.8154 10.0001 11.907 10.0001 12C10.0001 13.1046 10.8955 14 12.0001 14C12.2667 14 12.5212 13.9478 12.7538 13.8531L10.0187 11.7258Z"
                      fill="#ffffff"
                    ></path>
                    <path
                      d="M10.9506 8.13908L15.9995 12.0661C15.9999 12.0441 16.0001 12.022 16.0001 12C16.0001 9.79085 14.2092 7.99999 12.0001 7.99999C11.6369 7.99999 11.285 8.04838 10.9506 8.13908Z"
                      fill="#ffffff"
                    ></path>
                    <path
                      d="M19.7953 12.2045C19.4494 12.8913 19.0626 13.5326 18.6397 14.1195L20.2175 15.3467C20.7288 14.6456 21.1849 13.8917 21.5816 13.104L21.6033 13.0611C21.6946 12.881 21.8125 12.6485 21.8652 12.3618C21.9072 12.1339 21.9072 11.8661 21.8652 11.6381C21.8125 11.3514 21.6946 11.1189 21.6033 10.9389L21.5816 10.896C19.6419 7.04402 16.2803 3.99998 12.0001 3.99998C10.2848 3.99998 8.71714 4.48881 7.32934 5.32257L9.05854 6.66751C9.98229 6.23476 10.9696 5.99998 12.0001 5.99998C15.2329 5.99998 18.0404 8.31058 19.7953 11.7955C19.824 11.8525 19.8453 11.8948 19.8632 11.9316C19.879 11.964 19.8888 11.9853 19.8952 12C19.8888 12.0147 19.879 12.036 19.8632 12.0684C19.8453 12.1052 19.824 12.1474 19.7953 12.2045Z"
                      fill="#ffffff"
                    ></path>
                  </g>
                </svg>
              )}
              {showInput ? "Hide Input" : "Show Input"}
            </button>

            <button
              onClick={() => setZoom((z) => z + 0.1)}
              className="px-3 py-2 bg-gray-700 rounded flex flex-row content-center justify-center font-semibold"
            >
              <svg
                fill="#ffffff"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#ffffff"
                width={18}
                height={18}
                style={{ marginRight: "5px", marginTop: "3px" }}
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M11 6H9v3H6v2h3v3h2v-3h3V9h-3z"></path>
                  <path d="M10 2c-4.411 0-8 3.589-8 8s3.589 8 8 8a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8zm0 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"></path>
                </g>
              </svg>
              Zoom In
            </button>

            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              className="px-3 py-2 bg-gray-700 rounded flex flex-row content-center justify-center font-semibold"
            >
              <svg
                fill="#fff"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#fff"
                width={18}
                height={18}
                style={{ marginRight: "5px", marginTop: "3px" }}
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M6 9h8v2H6z"></path>
                  <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                </g>
              </svg>
              Zoom Out
            </button>

            <button
              onClick={enableDrag}
              className={`px-3 py-2 rounded flex flex-row content-center justify-center font-semibold
                ${dragEnabled ? "bg-blue-600" : "bg-gray-700"}`}
            >
              <svg
                fill="#fff"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#fff"
                width={18}
                height={18}
                style={{ marginRight: "5px", marginTop: "3px" }}
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M18 11h-5V6h3l-4-4-4 4h3v5H6V8l-4 4 4 4v-3h5v5H8l4 4 4-4h-3v-5h5v3l4-4-4-4z"></path>
                </g>
              </svg>
              {dragEnabled ? "Disable Drag" : "Enable Drag"}
            </button>

            <button
              onClick={() => {
                setAddPointMode((v) => {
                  const next = !v;
                  if (next) {
                    setSelectedMarkId(null);
                  }
                  return next;
                });
              }}
              className={`px-3 py-2 rounded ${
                addPointMode ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              {addPointMode ? "Adding Points…" : "Add Point"}
            </button>

            <select
              value={pointColor}
              onChange={(e) => {
                const newColor = e.target.value;
                setPointColor(newColor);

                if (selectedMarkId) {
                  setMarks((prev) =>
                    prev.map((m) =>
                      m.id === selectedMarkId ? { ...m, color: newColor } : m
                    )
                  );
                }
              }}
              className="px-2 py-2 bg-gray-700 rounded"
            >
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
              <option value="cyan">Cyan</option>
              <option value="magenta">Magenta</option>
              <option value="orange">Orange</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="teal">Teal</option>
              <option value="pink">Pink</option>
              <option value="gold">Gold</option>
              <option value="dodgerblue">Dodger Blue</option>
            </select>

            <select
              value={pointThickness ?? "none"}
              onChange={(e) => {
                const v = e.target.value;
                const newThickness =
                  v === "none" ? null : (Number(v) as Thickness);
                setPointThickness(newThickness);

                if (selectedMarkId) {
                  setMarks((prev) =>
                    prev.map((m) =>
                      m.id === selectedMarkId
                        ? { ...m, thickness: newThickness }
                        : m
                    )
                  );
                }
              }}
              className="px-2 py-2 bg-gray-700 rounded"
            >
              <option value="none">No thickness</option>
              <option value="20">2 (20mm)</option>
              <option value="30">3 (30mm)</option>
              <option value="40">4 (40mm)</option>
              <option value="50">5 (50mm)</option>
            </select>

            <select
              value={pointSection}
              onChange={(e) => {
                const newSection = e.target.value as SectionType;
                setPointSection(newSection);

                selectedMarkId &&
                  setMarks((prev) =>
                    prev.map((m) =>
                      m.id === selectedMarkId
                        ? { ...m, section: e.target.value as SectionType }
                        : m
                    )
                  );
              }}
              className="px-2 py-2 bg-gray-700 rounded"
            >
              <option value="whole">1 – Whole</option>
              <option value="half-vertical">0.5 – Vertical cut</option>
              <option value="half-horizontal">0.5 – Horizontal cut</option>
            </select>

            <button
              onClick={deleteSelected}
              disabled={!selectedMarkId}
              className={`px-3 py-2 rounded font-semibold
                ${
                  selectedMarkId
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-600 opacity-50 cursor-not-allowed"
                }`}
            >
              Delete Selected
            </button>

            <button
              onClick={deleteAll}
              className="px-3 py-2 bg-red-700 rounded"
            >
              Delete All
            </button>
          </div>

          <div
            ref={wrapperRef}
            className="overflow-auto w-full border border-gray-700 rounded-lg bg-gray-800 p-2 select-none"
            style={{
              maxWidth: "95vw",
              maxHeight: containerMaxHeight,
              cursor: dragEnabled ? "grab" : "default",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => {
              if (addPointMode) {
                handleAddTickClick(e);
              } else {
                setSelectedMarkId(null);
              }
            }}
          >
            <div
              style={{
                position: "relative",
                width: size.w * zoom,
                height: size.h * zoom,
              }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="img"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
                className="rounded shadow-xl"
                style={{
                  width: size.w * zoom,
                  height: size.h * zoom,
                  display: "block",
                  pointerEvents: dragEnabled ? "none" : "auto",
                }}
              />

              {marks.map((m) => (
                <div
                  key={m.id}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (!addPointMode) {
                      setSelectedMarkId(m.id);
                      setPointColor(m.color);
                      setPointThickness(m.thickness ?? null);
                      setPointSection(m.section ?? "whole");
                    }
                  }}
                  title="Click to select"
                  style={{
                    position: "absolute",
                    left: m.x * zoom,
                    top: m.y * zoom,
                    width: 18,
                    height: 18,
                    background: m.color,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    cursor: addPointMode ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: darkTextColors.has(m.color) ? "black" : "white",
                    userSelect: "none",
                    boxShadow:
                      m.id === selectedMarkId ? "0 0 0 3px #22c55e" : "none",
                  }}
                >
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 18 18"
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                    }}
                  >
                    {(() => {
                      const section = m.section ?? "whole";

                      if (section === "whole") {
                        return (
                          <circle
                            cx="9"
                            cy="9"
                            r="8"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      }

                      if (section === "half-vertical") {
                        return (
                          <path
                            d="
                            M9 1
                            A8 8 0 0 0 9 17
                          "
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        );
                      }

                      if (section === "half-horizontal") {
                        return (
                          <path
                            d="
                            M1 9
                            A8 8 0 0 0 17 9
                          "
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        );
                      }

                      return null;
                    })()}
                  </svg>

                  {m.thickness ? m.thickness / 10 : ""}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
