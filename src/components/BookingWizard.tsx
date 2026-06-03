import React, { useState } from "react";
import { useFirebase } from "../FirebaseContext";
import { ArrowLeft, Clock, Calendar, CheckCircle2, Wallet, Plus } from "lucide-react";
import { motion } from "motion/react";
import { Booking } from "../types";

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <h3 className="font-bold text-white font-display">Tutor Profile Not Found</h3>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white">
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
      tutorColor: tutor.color || "#4f46e5",
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER BAR */}
      <header className="sticky top-0 bg-slate-900 border-b border-slate-800 z-40 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-1 px-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-white font-display text-sm">Schedule Session</span>
      </header>

      {/* BODY COLUMN */}
      <div className="flex-1 max-w-lg w-full mx-auto p-4 space-y-6 pb-24">
        
        {/* TUTOR QUICK RECAP */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div 
            className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white uppercase shadow-inner"
            style={{ backgroundColor: tutor.color || "#4f46e5" }}
          >
            {tutor.avatar || tutor.name.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight font-display">{tutor.name}</h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Rate: <strong>₹{tutor.rate}/class</strong> &nbsp;·&nbsp; Resident: {tutor.city}
            </p>
          </div>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className={`p-4 rounded-2xl border ${
          insufficientFunds 
            ? "border-red-500/20 bg-red-500/5 text-red-300" 
            : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
        } flex items-center justify-between gap-4 font-sans`}>
          <div className="space-y-1">
            <span className="block text-[8px] font-bold tracking-wider font-mono uppercase text-slate-500">YOUR WALLET</span>
            <div className="text-base font-bold font-mono">₹{userBalance} available</div>
            {insufficientFunds && (
              <span className="block text-[10px] text-red-400">Insufficent Funds! You need ₹{tutor.rate - userBalance} more to confirm book.</span>
            )}
          </div>

          {insufficientFunds ? (
            <button
              onClick={() => {
                addFunding(500);
              }}
              className="py-1.5 px-3 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus size={11} /> Load ₹500
            </button>
          ) : (
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={14} /> Balances OK
            </div>
          )}
        </div>

        {/* BOOKINGS FORM */}
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Select Educational Topic *</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
              required
            >
              <option value="">Choose subject...</option>
              {(tutor.subjects || []).map((sub, i) => (
                <option key={i} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Select Session Date *</label>
            <div className="relative">
              <input
                type="date"
                min={minDateStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Select Starting Time Slot *</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Preferred Mode Of Instruction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("Online")}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  mode === "Online"
                    ? "bg-slate-100 text-slate-950 font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                🌐 Online Class
              </button>
              <button
                type="button"
                disabled={tutor.mode === "Online"}
                onClick={() => setMode("Offline")}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  mode === "Offline"
                    ? "bg-slate-100 text-slate-950 font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                } ${tutor.mode === "Online" ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                🏠 Offline Location
              </button>
            </div>
            {tutor.mode === "Online" && (
              <p className="text-[9px] text-slate-500 font-sans italic text-center">Tutor only accommodates Online classes.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Aide Message Notes <span className="opacity-50">(opt)</span></label>
            <textarea
              rows={3}
              placeholder="What specifically do you need training or help with? Board exams, entrance mocks..."
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans resize-none"
            />
          </div>

          {/* BOOKING TOTAL CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-[9px] font-bold tracking-wider font-mono uppercase text-slate-500">SUMMARY STATS</span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans">Topic selected:</span>
              <strong className="text-slate-200">{subject || "Not selected"}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans">Slots booked:</span>
              <strong className="text-slate-200 font-mono">{date || "—"} @ {time || "—"}</strong>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-850">
              <span className="text-slate-400 font-sans">Total Session Charge:</span>
              <strong className="text-emerald-400 text-base font-mono">₹{tutor.rate}</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={insufficientFunds}
            className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow shadow-indigo-600/10 ${
              insufficientFunds 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-[0.99]"
            }`}
          >
            Confirm Reservation Requests
          </button>
        </form>
      </div>
    </div>
  );
};
