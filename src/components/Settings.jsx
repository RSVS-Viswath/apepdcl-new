import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";

export default function Settings() {
  const navigate = useNavigate();

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);

  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  const handleVerifyPhone = () => {
    // replace with real verification logic
    if (phoneOtp.trim() !== "") {
      setPhoneVerified(true);
      setShowPhoneOtp(false);
      setPhoneOtp("");
    }
  };

  const handleVerifyEmail = () => {
    // replace with real verification logic
    if (emailOtp.trim() !== "") {
      setEmailVerified(true);
      setShowEmailOtp(false);
      setEmailOtp("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 relative overflow-auto">
        {/* Close button */}
        <button
          onClick={() => navigate(-1)}
          aria-label="Close settings"
          className="
            absolute top-4 right-4
            p-2 rounded-full
            hover:bg-gray-100
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-500
          "
        >
          <FiX className="text-xl" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-6">Settings</h2>

        <form className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Username spanning 2 columns */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                placeholder="Your username"
                disabled
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Enter phone number"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* OTP link or Verified badge */}
                {!phoneVerified ? (
                  <button
                    type="button"
                    onClick={() => setShowPhoneOtp(true)}
                    className="text-sm text-blue-600 underline px-2 py-1 focus:outline-none"
                    aria-expanded={showPhoneOtp}
                    aria-controls="phone-otp-row"
                  >
                    OTP
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                    Verified
                  </span>
                )}
              </div>

              {/* OTP input row with Verify button on the right */}
              {showPhoneOtp && !phoneVerified && (
                <div id="phone-otp-row" className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPhone}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Verify
                  </button>
                </div>
              )}

              {phoneVerified && (
                <p className="text-sm text-green-600 mt-2">Phone verified</p>
              )}
            </div>

            {/* Email Address */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="email"
                  placeholder="Enter email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* OTP link or Verified badge */}
                {!emailVerified ? (
                  <button
                    type="button"
                    onClick={() => setShowEmailOtp(true)}
                    className="text-sm text-blue-600 underline px-2 py-1 focus:outline-none"
                    aria-expanded={showEmailOtp}
                    aria-controls="email-otp-row"
                  >
                    OTP
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                    Verified
                  </span>
                )}
              </div>

              {/* OTP input row with Verify button on the right */}
              {showEmailOtp && !emailVerified && (
                <div id="email-otp-row" className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Verify
                  </button>
                </div>
              )}

              {emailVerified && (
                <p className="text-sm text-green-600 mt-2">Email verified</p>
              )}
            </div>
          </div>

          {/* New Password and Re-enter */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">Re-enter New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}