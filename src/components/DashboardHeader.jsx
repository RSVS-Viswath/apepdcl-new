import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiHelpCircle, FiLogOut, FiSettings, FiUser, FiX } from "react-icons/fi";

function ModalShell({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl border p-5">
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
        >
          <FiX className="text-xl" />
        </button>
        <div className="text-lg font-semibold pr-10">{title}</div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-5">{footer}</div> : null}
      </div>
    </div>
  );
}

function HelpSupportModal({ onClose }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  return (
    <ModalShell
      title="Help & Support"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              // No backend required
              console.log("Help request", { title, message });
              onClose();
            }}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700"
          >
            Send Request
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="Enter title"
            type="text"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm min-h-28 resize-y"
            placeholder="Enter message"
          />
        </label>

        <div className="text-sm text-gray-700 pt-2">
          <div>
            <span className="font-medium">Email:</span> support@xxxxxxxx.com
          </div>
          <div>
            <span className="font-medium">Mobile:</span> +91 xxxxxxx
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function OtpRow({ label, value, onChange, verified, onRequestOtp, otpState }) {
  const { showOtp, setShowOtp, otp, setOtp, setVerified } = otpState;
  return (
    <div className="grid gap-2">
      <div className="text-sm text-gray-700">{label}</div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          type="text"
        />
        {verified ? (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm whitespace-nowrap">
            Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowOtp(true);
              onRequestOtp?.();
            }}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 whitespace-nowrap"
          >
            OTP
          </button>
        )}
      </div>
      {showOtp && !verified ? (
        <div className="flex items-center gap-2">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            placeholder="Enter OTP"
            type="text"
          />
          <button
            type="button"
            onClick={() => {
              const ok = String(otp).trim().length >= 4;
              if (!ok) return;
              setVerified(true);
              setShowOtp(false);
              setOtp("");
            }}
            className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
          >
            Verify
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SettingsModal({ onClose }) {
  const [username, setUsername] = useState("apepdcl-user");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  return (
    <ModalShell
      title="Settings"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Save settings", {
                username,
                mobile,
                mobileVerified,
                email,
                emailVerified,
                newPassword,
                confirmNewPassword,
              });
              onClose();
            }}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700"
          >
            Save Settings
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            type="text"
          />
        </label>

        <OtpRow
          label="Mobile"
          value={mobile}
          onChange={setMobile}
          verified={mobileVerified}
          onRequestOtp={() => console.log("Request OTP mobile")}
          otpState={{
            showOtp: showMobileOtp,
            setShowOtp: setShowMobileOtp,
            otp: mobileOtp,
            setOtp: setMobileOtp,
            setVerified: setMobileVerified,
          }}
        />

        <OtpRow
          label="Email Address"
          value={email}
          onChange={setEmail}
          verified={emailVerified}
          onRequestOtp={() => console.log("Request OTP email")}
          otpState={{
            showOtp: showEmailOtp,
            setShowOtp: setShowEmailOtp,
            otp: emailOtp,
            setOtp: setEmailOtp,
            setVerified: setEmailVerified,
          }}
        />

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">New Password</span>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              type="password"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Confirm New Password</span>
            <input
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              type="password"
            />
          </label>
        </div>
      </div>
    </ModalShell>
  );
}

export default function DashboardHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const navClass = useMemo(
    () =>
      (active) =>
        `px-3 py-2 rounded-lg text-sm font-medium transition ${
          active ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-white/60 hover:text-gray-900"
        }`,
    []
  );

  const monitorTab = useMemo(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    return tab === "industrial" ? "industrial" : "commercial";
  }, [location.search]);
  const pathParts = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);
  const consumerScopedPage = pathParts[0] === "stats" || pathParts[0] === "analytics";
  const consumerServiceNo = consumerScopedPage ? decodeURIComponent(pathParts[1] || "") : "";
  const analyticsHref = consumerServiceNo ? `/analytics/${encodeURIComponent(consumerServiceNo)}${location.search}` : "";

  const isOverviewActive = location.pathname === "/";
  const isMonitorActive = location.pathname === "/monitor";
  const isConsumerActive = isMonitorActive && monitorTab === "commercial";
  const isIndustrialActive = isMonitorActive && monitorTab === "industrial";
  const isAnalyticsActive = pathParts[0] === "analytics" || pathParts[0] === "stats";

  const accountName = "APEPDCL";

  return (
    <>
      <header className="sticky top-0 z-50 bg-gray-50/90 backdrop-blur">
        <div className="w-full px-4 2xl:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="https://ap.elementsenergies.com/images/eelogo.webp"
              alt="Logo"
              className="h-9 w-auto object-contain shrink-0"
            />
            <div className="font-semibold text-gray-900 truncate">APEPDCL Dashboard</div>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/" className={navClass(isOverviewActive)}>
              Overview
            </NavLink>
            <NavLink to="/monitor?tab=commercial" className={navClass(isConsumerActive)}>
              Commercial
            </NavLink>
            <NavLink to="/monitor?tab=industrial" className={navClass(isIndustrialActive)}>
              Industrial
            </NavLink>
            {consumerScopedPage && consumerServiceNo ? (
              <NavLink to={analyticsHref} className={navClass(isAnalyticsActive)}>
                Analytics
              </NavLink>
            ) : null}

            <div className="relative ml-1">
              <button
                ref={buttonRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className={`w-10 h-10 rounded-full border shadow-sm flex items-center justify-center transition ${
                  menuOpen ? "bg-indigo-600 border-indigo-600" : "bg-white hover:bg-gray-50"
                }`}
              >
                <FiUser className={`text-xl ${menuOpen ? "text-white" : "text-gray-700"}`} />
              </button>

              {menuOpen ? (
                <div
                  ref={menuRef}
                  role="menu"
                  className="absolute right-0 mt-2 w-64 bg-white border shadow-lg rounded-xl p-2"
                >
                  <div className="px-3 pt-2 pb-1">
                    <div className="text-[11px] tracking-wide uppercase text-gray-500">Account</div>
                    <div className="text-sm font-semibold text-gray-900 mt-0.5">Hi, {accountName}</div>
                  </div>
                  <div className="h-px bg-gray-200 my-2" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setHelpOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FiHelpCircle className="text-lg" />
                    Help &amp; Support
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FiSettings className="text-lg" />
                    Settings
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      console.log("Logout");
                      navigate("/", { replace: true });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut className="text-lg" />
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      </header>

      {helpOpen ? <HelpSupportModal onClose={() => setHelpOpen(false)} /> : null}
      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
    </>
  );
}
