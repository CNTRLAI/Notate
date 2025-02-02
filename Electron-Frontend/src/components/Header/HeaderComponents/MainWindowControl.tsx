import { Minimize, Minus, X, Maximize2Icon } from "lucide-react";
import { useEffect, useState } from "react";

const MainWindowControl = ({
  isMaximized,
  setIsMaximized,
  platform,
}: {
  isMaximized: boolean;
  setIsMaximized: (isMaximized: boolean) => void;
  platform: string | null;
}) => {
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  if (platform === "darwin") {
    return (
      <div className={`flex pl-2 ${isFocused ? "focus-within" : ""}`}>
        <div className="flex window-controls">
          <button
            className="close header-button"
            id="close"
            onClick={() => window.electron.sendFrameAction("close")}
          >
            <span className="hidden">
              <X className="m-auto text-black font-bold " size={10} />
            </span>
          </button>
          <button
            className="minimize header-button"
            id="minimize"
            onClick={() => window.electron.sendFrameAction("minimize")}
          >
            <span className="hidden">
              <Minus className="m-auto text-black font-bold" size={8} />
            </span>
          </button>
          <button
            className={`${isMaximized ? "restore" : "maximize"} header-button`}
            id={isMaximized ? "unmaximize" : "maximize"}
            onClick={() => {
              setIsMaximized(!isMaximized);
              window.electron.sendFrameAction(
                isMaximized ? "unmaximize" : "maximize"
              );
            }}
          >
            <span className="hidden">
              {isMaximized ? (
                <Minimize className="m-auto text-black font-bold" size={8} />
              ) : (
                <Maximize2Icon
                  className="m-auto text-black font-bold"
                  size={8}
                />
              )}
            </span>
          </button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex order-last items-center">
        <button
          className="win-header-button group"
          onClick={() => window.electron.sendFrameAction("minimize")}
        >
          <svg width="10" height="10" viewBox="0 0 10 1">
            <path d="M0 0h10v1H0z" fill="currentColor" />
          </svg>
        </button>
        <button
          className={`win-header-button group`}
          onClick={() => {
            setIsMaximized(!isMaximized);
            window.electron.sendFrameAction(
              isMaximized ? "unmaximize" : "maximize"
            );
          }}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 0v10h10V0H0zm1 1h8v8H1V1z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" />
            </svg>
          )}
        </button>
        <button
          className="win-header-button win-close"
          onClick={() => window.electron.sendFrameAction("close")}
        >
          <p className="leading-none text-[12px]">&#x2715;</p>
        </button>
      </div>
    );
  }
};

export default MainWindowControl;
