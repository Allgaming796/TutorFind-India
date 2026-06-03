import React, { useState } from "react";
import { useFirebase } from "../FirebaseContext";
import { 
  Users, Check, X, MessageSquare, Wallet, User, Activity, 
  LogOut, Star, Edit, DollarSign, Award, ArrowUpRight, TrendingUp, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Booking } from "../types";

export const TutorDashboard: React.FC = () => {
  const { 
    userProfile, 
    bookings, 
    chats, 
    logOut, 
    updateBookingStatus, 
    withdrawFunding, 
    setActiveChatId,
    triggerToast 
  } = useFirebase();

  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "chats" | "wallet" | "profile">("overview");
  const [weeklyTargetClasses, setWeeklyTargetClasses] = useState(5);

  // Profile Edit Buffer
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name || "");
  const [editRate, setEditRate] = useState(String(userProfile?.rate || "400"));
  const [editExp, setEditExp] = useState(userProfile?.exp || "");
  const [editBio, setEditBio] = useState(userProfile?.bio || "");
  const [editQual, setEditQual] = useState(userProfile?.qual || "");

  const handleSaveProfile = async () => {
    if (!editName || !editRate || isNaN(Number(editRate))) {
      triggerToast("Name and valid Fee rate are required.");
      return;
    }
    await useFirebase().updateProfile({
      name: editName,
      rate: Number(editRate),
      exp: editExp,
      bio: editBio,
      qual: editQual
    });
    setIsEditing(false);
  };

  const tutorBookings = bookings.filter(b => b.tutorId === userProfile?.uid);
  const pendingRequests = tutorBookings.filter(b => b.status === "pending");
  const confirmedSessions = tutorBookings.filter(b => b.status === "confirmed");

  // Wallet projections
  const sessionRate = userProfile?.rate || 400;
  const projectWeekly = sessionRate * weeklyTargetClasses;
  const projectMonthly = projectWeekly * 4;
  const projectAnnual = projectMonthly * 12;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER BANNER */}
      <header className="sticky top-0 bg-slate-900 border-b border-slate-800 z-40 px-4 py-3 shadow-lg shadow-black/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-xl shadow-inner">
              👨‍🏫
            </div>
            <div>
              <h1 className="text-sm font-bold font-display tracking-tight text-white leading-tight">TutorFind India</h1>
              <p className="text-[10px] text-slate-400 font-sans flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse mr-0.5"></span>
                Tutor Dashboard &nbsp;·&nbsp; 📍 <strong>{userProfile?.city}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setActiveTab("wallet")}
              className="py-1.5 px-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/30 rounded-xl flex items-center gap-1.5 transition-all text-xs font-mono font-bold text-slate-200"
            >
              <Wallet size={12} className="text-emerald-400" />
              ₹{userProfile?.walletBalance || 0}
            </button>
            <button 
              onClick={logOut}
              className="p-2 bg-slate-950 hover:bg-red-950/20 border border-slate-800 hover:border-red-500/30 rounded-xl text-slate-400 hover:text-red-400 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* VIEWS SECTION */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                  <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase block">HOURLY RATE</span>
                  <div className="text-xl font-bold font-display text-white mt-1">₹{userProfile?.rate || 0}/class</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                  <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase block">TOTAL EARNED</span>
                  <div className="text-xl font-bold font-display text-emerald-400 mt-1">₹{userProfile?.totalEarned || 0}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                  <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase block">AVERAGE RATING</span>
                  <div className="text-xl font-bold font-display text-amber-400 mt-1 flex items-center gap-1">
                    {userProfile?.rating || "5.0"} <Star size={14} fill="currentColor" />
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                  <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase block">PENDING CHATS</span>
                  <div className="text-xl font-bold font-display text-indigo-400 mt-1">{chats.length}</div>
                </div>
              </div>

              {/* Student Requests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider font-mono uppercase">
                    Pending Class Bookings ({pendingRequests.length})
                  </h3>
                  <button onClick={() => setActiveTab("requests")} className="text-xs text-indigo-400 font-bold hover:underline">
                    View All Inboxes
                  </button>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 font-sans">
                    <Sparkles className="mx-auto mb-2 text-indigo-400" size={24} />
                    <p className="text-xs text-slate-400 font-medium">You have addressed all class reservation inquiries! 🚀</p>
                  </div>
                ) : (
                  pendingRequests.slice(0, 3).map((req) => (
                    <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-2.5 bg-slate-950 text-slate-300 rounded font-bold text-[10px] uppercase font-mono">
                            {req.subject}
                          </span>
                          <span className="text-slate-500 text-xs font-medium font-sans">For {req.grade}</span>
                        </div>
                        <h4 className="text-white font-bold font-display mt-1 text-sm">{req.studentName}</h4>
                        <p className="text-slate-400 text-xs font-sans mt-0.5">
                          📅 {req.date} &nbsp;·&nbsp; 🕐 {req.time} &nbsp;·&nbsp; Mode: <strong>{req.mode}</strong>
                        </p>
                        {req.msg && (
                          <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs leading-relaxed text-slate-400 mt-2 font-sans italic">
                            "{req.msg}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={async () => {
                            const rId = await useFirebase().createChatRoom(req.studentId);
                            setActiveChatId(rId);
                            setActiveTab("chats");
                          }}
                          className="py-1.5 px-3 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-semibold rounded-lg border border-slate-850 cursor-pointer"
                        >
                          Chat
                        </button>
                        <button 
                          onClick={() => updateBookingStatus(req.id, "cancelled")}
                          className="p-2 bg-slate-950 hover:bg-red-950/20 text-red-500 border border-slate-850 hover:border-red-500/20 rounded-lg cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                        <button 
                          onClick={() => updateBookingStatus(req.id, "confirmed")}
                          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 cursor-pointer font-bold text-xs"
                        >
                          <Check size={14} /> Accept Request
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Upcoming Scheduled classes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider font-mono uppercase">
                  Upcoming Scheduled Classes ({confirmedSessions.length})
                </h3>

                {confirmedSessions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs italic">
                    No confirmed session bookings. Accepted student requests lists here.
                  </div>
                ) : (
                  confirmedSessions.map(sess => (
                    <div key={sess.id} className="bg-slate-900 border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white font-display">{sess.studentName}</h4>
                          <span className="text-[8px] font-bold font-mono tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-0.5 px-2 rounded-full uppercase">
                            ACTIVE SCHED
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs font-sans mt-0.5">
                          📖 {sess.subject} &nbsp;·&nbsp; ⏳ {sess.date} @ {sess.time} ({sess.mode})
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-850">
                        ₹{sess.rate} earned
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "requests" && (
            <motion.div 
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold font-display text-white mb-2">Student Booking Requests</h2>

              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
                  <Users className="mx-auto mb-4 text-slate-600" size={32} />
                  <h3 className="text-slate-300 font-bold">No active requests</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your tutor profile is online. Student inquiries will synchronize here in real-time.
                  </p>
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-950 text-indigo-400 border border-slate-850 py-1 px-2.5 rounded">
                        {req.subject}
                      </span>
                      <span className="text-xs text-slate-400">Class: <strong>{req.grade}</strong></span>
                    </div>

                    <div className="font-sans">
                      <h3 className="font-bold text-white text-base">{req.studentName}</h3>
                      <p className="text-slate-400 text-sm mt-0.5">
                        📆 Scheduled on {req.date} at {req.time} ({req.mode})
                      </p>
                    </div>

                    {req.msg && (
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-400 italic">
                        "{req.msg}"
                      </div>
                    )}

                    <div className="flex gap-2 pt-1 border-t border-slate-800/60">
                      <button
                        onClick={async () => {
                          const rId = await useFirebase().createChatRoom(req.studentId);
                          setActiveChatId(rId);
                          setActiveTab("chats");
                        }}
                        className="flex-1 py-2 bg-slate-950 text-slate-300 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare size={13} />
                        Chat With Student
                      </button>
                      <button
                        onClick={() => updateBookingStatus(req.id, "cancelled")}
                        className="p-2 bg-slate-950 hover:bg-red-950/20 text-red-500 border border-slate-850 hover:border-red-500/20 rounded-xl"
                        title="Decline"
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => updateBookingStatus(req.id, "confirmed")}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                      >
                        <Check size={14} />
                        Accept Request
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "chats" && (
            <motion.div 
              key="chats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold font-display text-white mb-2">Student Dialogues</h2>

              {chats.length === 0 ? (
                <div className="py-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
                  <MessageSquare className="mx-auto mb-4 text-slate-600" size={32} />
                  <h3 className="text-slate-300 font-bold">No active conversations</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    When active students send messaging inquiries, they will list instantly here
                  </p>
                </div>
              ) : (
                chats.map((c) => {
                  const hasUnread = c.tutorUnread && c.tutorUnread > 0;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setActiveChatId(c.id);
                        useFirebase().setActiveChatId(c.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                        hasUnread 
                          ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-600/5" 
                          : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
                      }`}
                    >
                      <div 
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white uppercase shadow flex-shrink-0 relative"
                        style={{ backgroundColor: c.studentColor || "#10b981" }}
                      >
                        {c.studentAvatar || "S"}
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full animate-pulse border border-slate-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-bold ${hasUnread ? "text-indigo-300" : "text-white"}`}>
                            {c.studentName}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(c.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 truncate ${hasUnread ? "text-slate-200 font-semibold" : "text-slate-400"}`}>
                          {c.lastMsg}
                        </p>
                      </div>

                      <span className="text-xs text-slate-500 flex items-center justify-center w-6 h-6 border border-slate-850 rounded-lg">
                        →
                      </span>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === "wallet" && (
            <motion.div 
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Wallet Balance Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                {/* Graphics decoration */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />

                <span className="text-[10px] font-bold tracking-wider font-mono text-emerald-400 uppercase">Withdrawable Income Balance</span>
                <h3 className="text-4xl font-bold font-display text-white mt-1.5 flex items-baseline gap-1">
                  ₹{userProfile?.walletBalance || 0}
                  <span className="text-xs text-slate-500 font-normal font-sans">available credits</span>
                </h3>

                <p className="text-xs text-slate-400 mt-2 font-sans">
                  Total cumulative income cleared from completed student schedules. Withdrawals are processed instantly over Unified Payment Interfaces.
                </p>

                <div className="pt-5 border-t border-slate-800/60 mt-5">
                  <button 
                    onClick={() => {
                      const bal = userProfile?.walletBalance || 0;
                      if (bal <= 0) {
                        triggerToast("Your balance is zero. Complete scheduled classes to earn first!");
                        return;
                      }
                      withdrawFunding(bal);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 border border-emerald-500/30"
                  >
                    Withdraw All Earnings Instant (₹{userProfile?.walletBalance || 0})
                  </button>
                </div>
              </div>

              {/* INCOME POTENTIAL CALCULATOR */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-white">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <h4 className="font-bold text-sm font-display">Tutor Earnings Projection</h4>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Based on your rate of <strong>₹{sessionRate}/class</strong>. slide the dial below to estimate weekly target class completions!
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Weekly Target Sessions</span>
                    <span className="text-base font-bold font-mono text-emerald-400">{weeklyTargetClasses} lessons/week</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={weeklyTargetClasses}
                    onChange={(e) => setWeeklyTargetClasses(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center font-sans">
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
                    <span className="block text-[8px] font-bold text-slate-500 tracking-wider font-mono">WEEKLY INCOME</span>
                    <span className="text-sm text-white font-bold font-mono">₹{projectWeekly.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
                    <span className="block text-[8px] font-bold text-slate-500 tracking-wider font-mono">MONTHLY VALUE</span>
                    <span className="text-sm text-emerald-400 font-bold font-mono">₹{projectMonthly.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl font-semibold">
                    <span className="block text-[8px] font-bold text-slate-500 tracking-wider font-mono">EST. ANNUAL</span>
                    <span className="text-sm text-indigo-400 font-bold font-mono">₹{projectAnnual.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white uppercase shadow-inner"
                    style={{ backgroundColor: userProfile?.color || "#4f46e5" }}
                  >
                    {userProfile?.avatar || userProfile?.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display flex items-center gap-1.5">
                      {userProfile?.name}
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        Educator
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      ✉️ {userProfile?.email}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-6 pt-6 border-t border-slate-800/60 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Session Fee (₹)</label>
                        <input
                          type="tel"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value.replace(/[^0-9]/g, ""))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Experience Level</label>
                        <input
                          type="text"
                          value={editExp}
                          onChange={(e) => setEditExp(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Qualifications</label>
                        <input
                          type="text"
                          value={editQual}
                          onChange={(e) => setEditQual(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Biographical Bio Intro</label>
                      <textarea
                        rows={3}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                      >
                        Save Settings
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-slate-800/60 grid grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-500 tracking-wider font-mono">LOCATION</span>
                      <strong className="text-slate-300 mt-1 block">{userProfile?.city || "Not Registered"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-500 tracking-wider font-mono">TEACHING GRADE</span>
                      <strong className="text-slate-300 mt-1 block">{userProfile?.grade || "All Grades"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-500 tracking-wider font-mono">CLASS CHARGE</span>
                      <strong className="text-slate-300 mt-1 block font-mono">₹{userProfile?.rate || 0}/class</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-500 tracking-wider font-mono">CREDENTIALS</span>
                      <strong className="text-slate-300 mt-1 block truncate">{userProfile?.qual || "Trained Educator"}</strong>
                    </div>
                    <div className="col-span-2 pt-1">
                      <span className="block text-[9px] font-bold text-slate-500 tracking-wider font-mono">BIO DETAILS</span>
                      <p className="text-slate-400 mt-1 leading-relaxed text-xs italic">{userProfile?.bio || "No custom biographer statement set."}</p>
                    </div>

                    <div className="col-span-2 pt-3">
                      <button
                        onClick={() => {
                          setEditName(userProfile?.name || "");
                          setEditRate(String(userProfile?.rate || "400"));
                          setEditExp(userProfile?.exp || "");
                          setEditBio(userProfile?.bio || "");
                          setEditQual(userProfile?.qual || "");
                          setIsEditing(true);
                        }}
                        className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850 hover:border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit size={13} />
                        Update Profile settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* DASHBOARD BOTTOM TABS BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 py-2 px-4 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          <button
            onClick={() => { setActiveTab("overview"); setActiveChatId(null); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "overview" ? "text-emerald-400 bg-emerald-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Activity size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Overview</span>
          </button>
          <button
            onClick={() => { setActiveTab("requests"); setActiveChatId(null); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all relative ${
              activeTab === "requests" ? "text-emerald-400 bg-emerald-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Users size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Requests</span>
            {pendingRequests.length > 0 && (
              <span className="absolute top-2.5 right-6 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab("chats"); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all relative ${
              activeTab === "chats" ? "text-emerald-400 bg-emerald-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <MessageSquare size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Dialogues</span>
            {chats.some(c => c.tutorUnread && c.tutorUnread > 0) && (
              <span className="absolute top-2.5 right-6 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab("wallet"); setActiveChatId(null); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "wallet" ? "text-emerald-400 bg-emerald-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Wallet size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Earning</span>
          </button>
          <button
            onClick={() => { setActiveTab("profile"); setActiveChatId(null); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "profile" ? "text-emerald-400 bg-emerald-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <User size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
