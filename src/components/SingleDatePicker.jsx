import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { fromDateKey, toDateKey } from "../lib/dateKey";

export default function SingleDatePicker({
  label = "Start Date",
  value,
  maxKey,
  onApply,
  wrapperClassName = "",
  triggerClassName = "",
  labelClassName = "",
  valueClassName = "",
  dialogTitle = "Select Date",
  calendarColor = "#4F46E5",
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => fromDateKey(value), [value]);
  const maxDate = useMemo(() => fromDateKey(maxKey), [maxKey]);
  const [draft, setDraft] = useState(selectedDate);

  useEffect(() => {
    setDraft(selectedDate);
  }, [selectedDate]);

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-auto min-w-[360px] max-w-[calc(100vw-2rem)] p-4 sm:p-5">
              <div className="text-lg font-semibold mb-3 text-center">{dialogTitle}</div>
              <div className="flex justify-center">
                <Calendar
                  date={draft}
                  onChange={(nextDate) => {
                    setDraft(nextDate);
                    onApply(toDateKey(nextDate));
                    setOpen(false);
                  }}
                  color={calendarColor}
                  maxDate={Number.isNaN(maxDate.getTime()) ? undefined : maxDate}
                  weekdayDisplayFormat="EE"
                  dayDisplayFormat="d"
                />
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border text-sm" type="button">
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className={wrapperClassName}>
        <div
          onClick={() => {
            setDraft(selectedDate);
            setOpen(true);
          }}
          className={`cursor-pointer select-none ${triggerClassName}`}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setDraft(selectedDate);
              setOpen(true);
            }
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className={labelClassName}>{label} :</div>
            <div className={valueClassName}>{value}</div>
          </div>
        </div>
      </div>
      {modal}
    </>
  );
}
