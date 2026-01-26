import { useState, useRef, useEffect } from "react";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="
          w-11 h-11 sm:w-10 sm:h-10
          rounded-full bg-gray-200
          flex items-center justify-center
          active:scale-95 transition
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-blue-500
        "
      >
        <FiUser className="text-gray-700 text-xl sm:text-2xl" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="
            absolute right-0 mt-2
            w-56 sm:w-60
            bg-white rounded-xl
            shadow-lg border p-2 z-50
          "
        >
          <p className="px-3 py-2 text-sm font-medium text-gray-700">
            Hi, User
          </p>

          <div className="space-y-1">
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
              className="
                w-full flex items-center gap-3
                px-3 py-2.5 rounded-lg
                text-sm text-gray-700
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-blue-500
                active:bg-gray-100
              "
            >
              <FiSettings className="text-lg" />
              Settings
            </button>

            <button
              role="menuitem"
              onClick={handleLogout}
              className="
                w-full flex items-center gap-3
                px-3 py-2.5 rounded-lg
                text-sm text-red-600
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-red-500
                active:bg-red-50
              "
            >
              <FiLogOut className="text-lg" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}