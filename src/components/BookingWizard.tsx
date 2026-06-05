import React, { useState } from "react";
import { useFirebase } from "../FirebaseContext";
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import { motion } from "motion/react";

interface BookingWizardProps {
  tutorIndex: number;
  onBack: () => void;
  onSuccess: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ tutorIndex, onBack, onSuccess }) => {
  const { tutors, userProfile, bookSession, triggerToast, addFunding } = useFirebase();

  const tutor = tutors[tutorIndex - 1];

  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState<"Online" | "Offline">("Online");
  const [msg, setMsg] = useState("");

  if (!tutor) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h3 className="font-bold text-black font-display uppercase tracking-widest">Tutor Profile Not Found</h3>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-black text-white rounded border-2 border-black text-xs font-bold font-display uppercase tracking-wider">
          Return Home
        </button>
      </div>
    );
  }

  const userBalance = userProfile?.walletBalance || 0;
  const insufficientFunds = userBalance < tutor.rate;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) {
      triggerToast("Please choose your focal lesson subject.");
      return;
    }
    if (!date) {
      triggerToast("Please select your class date.");
      return;
    }
    if (!time) {
      triggerToast("Please select your target hour slot.");
      return;
    }

    if (insufficientFunds) {
      triggerToast("Insufficient wallet funds. Please add money and retry.");
      return;
    }

    await bookSession({
      studentId: userProfile?.uid || "anon",
      studentName: userProfile?.name || "Student",
      tutorId: tutor.uid,
      tutorName: tutor.name,
      tutorAvatar: tutor.avatar || "T",
      tutorColor: "#000000",
      subject,
      date,
      time,
      mode,
      status: "pending",
      rate: tutor.rate,
      msg
    });

    onSuccess();
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      {/* HEADER BAR */}
      <header className="sticky top-0 bg-white border-b-2 border-black z-40 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-1 px-2 border-2 border-black rounded hover:bg-neutral-100 text-black transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-black font-display text-sm uppercase tracking-wider">Schedule Session</span>
      </header>

      {/* BODY COLUMN */}
      <div className="flex-1 max-w-lg w-full mx-auto p-4 space-y-6 pb-24">
        
        {/* TUTOR QUICK RECAP */}
        <div className="bg-white border-2 border-black rounded-lg p-4 flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]">
          <div 
            className="w-11 h-11 rounded-full border-2 border-black flex items-center justify-center font-bold text-white uppercase bg-black overflow-hidden shrink-0"
          >
            {tutor.avatar && (tutor.avatar.startsWith("data:image/") || tutor.avatar.startsWith("http")) ? (
              <img src={tutor.avatar} alt={tutor.name} className="w-full h-full object-cover" />
            ) : (
              tutor.avatar || tutor.name.slice(0, 2)
            )}
          </div>
          <div>
            <h3 className="font-bold text-black leading-tight font-display uppercase tracking-wide">{tutor.name}</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1 font-semibold">
              Rate: <strong>₹{tutor.rate}/class</strong> &nbsp;·&nbsp; Resident: {tutor.city}
            </p>
          </div>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className={`p-4 rounded-lg border-2 ${
          insufficientFunds 
            ? "border-neutral-500 bg-neutral-50 text-black" 
            : "border-black bg-neutral-50 text-black"
        } flex items-center justify-between gap-4 font-sans`}>
          <div className="space-y-1">
            <span className="block text-[8px] font-extrabold tracking-wider font-mono uppercase text-neutral-500">YOUR WALLET BALANCE</span>
            <div className="text-base font-bold font-mono">₹{userBalance} available</div>
            {insufficientFunds && (
              <span className="block text-[10px] text-neutral-600 font-bold">Needs ₹{tutor.rate - userBalance} more to secure bookings.</span>
            )}
          </div>

          {insufficientFunds ? (
            <button
              onClick={() => {
                addFunding(500);
              }}
              className="py-1.5 px-3 bg-black hover:bg-neutral-900 border-2 border-black text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-all active:translate-y-[1px]"
            >
              <Plus size={11} /> Deposit ₹500
            </button>
          ) : (
            <div className="text-xs text-black font-extrabold flex items-center gap-1 font-mono uppercase">
              <CheckCircle2 size={14} /> Balances OK
            </div>
          )}
        </div>

        {/* BOOKINGS FORM */}
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Select focal subject *</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-black rounded-lg text-black text-xs font-bold focus:outline-none focus:bg-neutral-50 cursor-pointer appearance-none"
              required
            >
              <option value="">Choose subject...</option>
              {(tutor.subjects || []).map((sub, i) => (
                <option key={i} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Select Session Date *</label>
            <input
              type="date"
              min={minDateStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg text-black text-xs font-bold font-mono focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Select Starting Time Slot *</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-black rounded-lg text-black text-xs font-bold focus:outline-none focus:bg-neutral-50 cursor-pointer appearance-none"
              required
            >
              <option value="">Choose starting hour...</option>
              <option value="09:00 AM">09:00 AM (Morning Dial)</option>
              <option value="11:00 AM">11:00 AM (Late Morning)</option>
              <option value="02:00 PM">02:00 PM (Afternoon Study)</option>
              <option value="04:00 PM">04:00 PM (Evening Class)</option>
              <option value="06:00 PM">06:00 PM (Late Sunset)</option>
              <option value="08:00 PM">08:00 PM (Night Class)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Preferred Mode Of Instruction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("Online")}
                className={`py-2 text-xs font-bold rounded transition-all border-2 ${
                  mode === "Online"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-neutral-200 hover:border-black"
                }`}
              >
                🌐 Online Class
              </button>
              <button
                type="button"
                disabled={tutor.mode === "Online"}
                onClick={() => setMode("Offline")}
                className={`py-2 text-xs font-bold rounded transition-all border-2 ${
                  mode === "Offline"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-neutral-200 hover:border-black"
                } ${tutor.mode === "Online" ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                🏠 Offline Location
              </button>
            </div>
            {tutor.mode === "Online" && (
              <p className="text-[9px] text-neutral-500 font-sans italic text-center mt-1">Educator only accommodates Online classes.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Extra notes <span className="opacity-50">(opt)</span></label>
            <textarea
              rows={3}
              placeholder="Focal topics details (IIT entrance mocks, board exams...)"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-black rounded-lg text-black text-xs font-bold focus:outline-none focus:bg-neutral-50 font-sans resize-none"
            />
          </div>

          {/* BOOKING TOTAL CARD */}
          <div className="bg-white border-2 border-black rounded-lg p-4 space-y-2 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <span className="text-[9px] font-extrabold tracking-wider font-mono uppercase text-neutral-500">LECTURE OVERVIEW STATS</span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-sans">Topic selected:</span>
              <strong className="text-black font-bold font-display uppercase">{subject || "Not selected"}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-sans">Time scheduled:</span>
              <strong className="text-black font-mono font-bold">{date || "—"} @ {time || "—"}</strong>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t-2 border-neutral-100">
              <span className="text-neutral-500 font-sans">Session lock price:</span>
              <strong className="text-black text-base font-mono font-extrabold">₹{tutor.rate}</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={insufficientFunds}
            className={`w-full py-3.5 rounded-lg font-bold font-display uppercase tracking-widest text-xs border-2 transition-all ${
              insufficientFunds 
                ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed" 
                : "bg-black text-white border-black cursor-pointer shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            }`}
          >
            Confirm Reservation Request
          </button>
        </form>
      </div>
    </div>
  );
};
