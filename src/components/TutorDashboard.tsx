import React, { useState } from "react";
import { useFirebase } from "../FirebaseContext";
import { 
  Users, Check, X, MessageSquare, Wallet, User, Activity, 
  LogOut, Star, Edit, TrendingUp, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      {/* HEADER BANNER */}
      <header className="sticky top-0 bg-white border-b-2 border-black z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-black border-2 border-black flex items-center justify-center text-xl shadow-sm text-white">
              👨‍🏫
            </div>
            <div>
              <h1 className="text-base font-bold font-display tracking-tight text-black uppercase leading-tight">TutorFind India</h1>
              <p className="text-[10px] text-neutral-600 font-mono flex items-center gap-0.5 mt-0.5">
                Tutor Dashboard &nbsp;·&nbsp; 📍 <strong>{userProfile?.city}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setActiveTab("wallet")}
              className="py-1.5 px-3 bg-white border-2 border-black hover:bg-neutral-50 rounded-md flex items-center gap-1.5 transition-all text-xs font-mono font-bold text-black"
            >
              <Wallet size={12} className="text-black" />
              ₹{userProfile?.walletBalance || 0}
            </button>
            <button 
              onClick={logOut}
              className="p-1.5 bg-white border-2 border-black hover:bg-neutral-50 hover:text-red-600 rounded-md text-black transition-all cursor-pointer"
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
                <div className="bg-white border-2 border-black p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                  <span className="text-[9px] font-bold text-neutral-500 font-mono tracking-wider uppercase block">HOURLY RATE</span>
                  <div className="text-xl font-bold font-display text-black mt-1">₹{userProfile?.rate || 0}/class</div>
                </div>
                <div className="bg-white border-2 border-black p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                  <span className="text-[9px] font-bold text-neutral-500 font-mono tracking-wider uppercase block">COINS CLEARED</span>
                  <div className="text-xl font-bold font-display text-black mt-1">₹{userProfile?.walletBalance || 0}</div>
                </div>
                <div className="bg-white border-2 border-black p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                  <span className="text-[9px] font-bold text-neutral-500 font-mono tracking-wider uppercase block">RATING</span>
                  <div className="text-xl font-bold font-display text-black mt-1 flex items-center gap-1">
                    {userProfile?.rating || "5.0"} <Star size={14} fill="currentColor" className="text-black" />
                  </div>
                </div>
                <div className="bg-white border-2 border-black p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                  <span className="text-[9px] font-bold text-neutral-500 font-mono tracking-wider uppercase block">CHATS</span>
                  <div className="text-xl font-bold font-display text-black mt-1">{chats.length}</div>
                </div>
              </div>

              {/* Student Requests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-black tracking-wider font-mono uppercase">
                    Pending Student Bookings ({pendingRequests.length})
                  </h3>
                  <button onClick={() => setActiveTab("requests")} className="text-xs text-black font-bold hover:underline uppercase tracking-wider font-mono">
                    View All Inboxes
                  </button>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border-2 border-black font-sans shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                    <Sparkles className="mx-auto mb-2 text-black animate-pulse" size={24} />
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">All booking requests addressed!</p>
                  </div>
                ) : (
                  pendingRequests.slice(0, 3).map((req) => (
                    <div key={req.id} className="bg-white border-2 border-black rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-2 bg-neutral-100 text-black border border-neutral-350 rounded font-bold text-[9px] uppercase font-mono">
                            {req.subject}
                          </span>
                          <span className="text-neutral-500 text-xs font-semibold">Class {req.grade}</span>
                        </div>
                        <h4 className="text-black font-bold font-display mt-1.5 text-base">{req.studentName}</h4>
                        <p className="text-neutral-600 text-xs font-semibold font-mono mt-0.5">
                          📅 {req.date} &nbsp;·&nbsp; 🕐 {req.time} &nbsp;·&nbsp; Mode: <strong>{req.mode}</strong>
                        </p>
                        {req.msg && (
                          <div className="p-2.5 bg-neutral-50 border-2 border-neutral-200 rounded-lg text-xs leading-relaxed text-neutral-600 mt-2 italic font-sans">
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
                          className="py-1.5 px-3 bg-white border-2 border-black hover:bg-neutral-50 text-black text-xs font-bold rounded cursor-pointer uppercase tracking-wider"
                        >
                          Chat
                        </button>
                        <button 
                          onClick={() => updateBookingStatus(req.id, "cancelled")}
                          className="p-2 border-2 border-black hover:bg-neutral-50 text-black hover:text-red-650 rounded cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                        <button 
                          onClick={() => updateBookingStatus(req.id, "confirmed")}
                          className="py-2 px-3 bg-black hover:bg-neutral-900 text-white rounded flex items-center gap-1.5 cursor-pointer font-bold text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(75,85,99,1)]"
                        >
                          <Check size={14} /> Accept Class
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Upcoming Scheduled classes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-black tracking-wider font-mono uppercase">
                  Upcoming Scheduled Lectures ({confirmedSessions.length})
                </h3>

                {confirmedSessions.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border-2 border-black text-neutral-400 text-xs italic shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">
                    No active student lectures scheduled. Accept classes to build lists.
                  </div>
                ) : (
                  confirmedSessions.map(sess => (
                    <div key={sess.id} className="bg-white border-2 border-black rounded-lg p-4 flex items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-black font-display">{sess.studentName}</h4>
                          <span className="text-[8px] font-bold font-mono tracking-wider text-black bg-neutral-100 border-2 border-black py-0.5 px-2 rounded-full uppercase">
                            Confirmed Class
                          </span>
                        </div>
                        <p className="text-neutral-600 text-xs font-semibold mt-0.5 font-mono">
                          📖 {sess.subject} &nbsp;·&nbsp; ⏳ {sess.date} @ {sess.time} ({sess.mode})
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-black bg-neutral-50 py-1.5 px-3 rounded-lg border-2 border-black">
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
              <h2 className="text-xl font-bold font-display text-black uppercase tracking-tight mb-2">Student Booking Requests</h2>

              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                  <Users className="mx-auto mb-4 text-black" size={32} />
                  <h3 className="text-black font-bold uppercase tracking-wider font-display">No requests</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Your certified educator profile is live. Student queries will sync here dynamically.
                  </p>
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white border-2 border-black rounded-lg p-5 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-neutral-100 text-black border-2 border-black py-1 px-2.5 rounded">
                        {req.subject}
                      </span>
                      <span className="text-xs text-neutral-600 font-bold">Class: <strong>{req.grade}</strong></span>
                    </div>

                    <div className="font-sans">
                      <h3 className="font-bold text-black text-base">{req.studentName}</h3>
                      <p className="text-neutral-500 text-sm mt-0.5">
                        Scheduled Class on {req.date} at {req.time} ({req.mode})
                      </p>
                    </div>

                    {req.msg && (
                      <div className="p-3 bg-neutral-50 border-2 border-neutral-250 rounded text-xs text-neutral-600 italic leading-relaxed">
                        "{req.msg}"
                      </div>
                    )}

                    <div className="flex gap-2 pt-1 border-t-2 border-neutral-100">
                      <button
                        onClick={async () => {
                          const rId = await useFirebase().createChatRoom(req.studentId);
                          setActiveChatId(rId);
                          setActiveTab("chats");
                        }}
                        className="flex-1 py-2 bg-white text-black hover:bg-neutral-50 border-2 border-black text-xs font-bold rounded flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer"
                      >
                        <MessageSquare size={13} />
                        Dialogue
                      </button>
                      <button
                        onClick={() => updateBookingStatus(req.id, "cancelled")}
                        className="p-2 bg-white hover:bg-neutral-50 border-2 border-black text-black rounded"
                        title="Decline"
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => updateBookingStatus(req.id, "confirmed")}
                        className="flex-1 py-2 bg-black hover:bg-neutral-900 border-2 border-black text-white font-bold text-xs rounded flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] uppercase tracking-wide cursor-pointer"
                      >
                        <Check size={14} />
                        Accept Class
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
              <h2 className="text-xl font-bold font-display text-black uppercase tracking-tight mb-2">Student Dialogues</h2>

              {chats.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <p className="text-3xl mb-4">💬</p>
                  <h3 className="text-black font-bold font-display uppercase tracking-wider">No dialog records</h3>
                  <p className="text-xs text-neutral-500 mt-1 font-sans">
                    Student inquiry dialogues synchronize here as soon as they reach your inbox.
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
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-4 ${
                        hasUnread 
                          ? "bg-neutral-50 border-black shadow-md font-bold text-black" 
                          : "bg-white border-neutral-300 hover:border-black"
                      }`}
                    >
                      <div 
                        className="w-11 h-11 rounded-full border-2 border-black flex items-center justify-center font-bold text-white uppercase bg-black relative flex-shrink-0"
                      >
                        {c.studentAvatar || "S"}
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black border border-white rounded-full animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-black">
                            {c.studentName}
                          </h4>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {new Date(c.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 truncate ${hasUnread ? "text-black font-bold" : "text-neutral-500"}`}>
                          {c.lastMsg}
                        </p>
                      </div>

                      <span className="text-xs text-black border-2 border-black flex items-center justify-center w-6 h-6 rounded-lg font-bold">
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
               <div className="bg-white border-2 border-black rounded-lg p-6 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                <span className="text-[10px] font-bold tracking-wider font-mono text-neutral-500 uppercase">Withdrawable Clearance balance</span>
                <h3 className="text-4xl font-bold font-display text-black mt-1.5 flex items-baseline gap-1 uppercase">
                  ₹{userProfile?.walletBalance || 0}
                  <span className="text-xs text-neutral-500 font-normal font-sans">INR cleared</span>
                </h3>

                <p className="text-xs text-neutral-600 mt-2 font-sans tracking-wide">
                  Total cumulative income cleared from completed student schedules. Withdrawals are processed instantly over Unified Payment Interfaces.
                </p>

                <div className="pt-5 border-t-2 border-neutral-100 mt-5">
                  <button 
                    onClick={() => {
                      const bal = userProfile?.walletBalance || 0;
                      if (bal <= 0) {
                        triggerToast("Your balance is zero. Complete scheduled classes to earn first!");
                        return;
                      }
                      withdrawFunding(bal);
                    }}
                    className="w-full py-3 bg-black hover:bg-neutral-900 border-2 border-black text-white font-bold text-xs rounded-lg shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] uppercase tracking-wide transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    Withdraw All Earnings Instant (₹{userProfile?.walletBalance || 0})
                  </button>
                </div>
              </div>

              {/* INCOME POTENTIAL CALCULATOR */}
              <div className="bg-white border-2 border-black rounded-lg p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                <div className="flex items-center gap-2 text-black">
                  <TrendingUp size={16} className="text-black" />
                  <h4 className="font-bold text-sm font-display uppercase tracking-wide">Estimator Calculator</h4>
                </div>

                <p className="text-xs text-neutral-600 font-sans leading-relaxed font-semibold">
                  Based on your configured rate of <strong>₹{sessionRate}/class</strong>. Slide the dial below to estimate weekly target class completions!
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-600 uppercase">Weekly Sessions</span>
                    <span className="text-base font-bold font-mono text-black">{weeklyTargetClasses} lessons/week</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={weeklyTargetClasses}
                    onChange={(e) => setWeeklyTargetClasses(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg appearance-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center font-sans">
                  <div className="p-2.5 bg-neutral-50 border-2 border-black rounded-lg">
                    <span className="block text-[8px] font-extrabold text-neutral-500 tracking-wider font-mono">WEEKLY INCOME</span>
                    <span className="text-xs text-black font-extrabold font-mono">₹{projectWeekly.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-neutral-50 border-2 border-black rounded-lg">
                    <span className="block text-[8px] font-extrabold text-neutral-500 tracking-wider font-mono">MONTHLY VALUE</span>
                    <span className="text-xs text-black font-extrabold font-mono">₹{projectMonthly.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-neutral-50 border-2 border-black rounded-lg">
                    <span className="block text-[8px] font-extrabold text-neutral-500 tracking-wider font-mono font-bold">EST. ANNUAL</span>
                    <span className="text-xs text-black font-extrabold font-mono">₹{projectAnnual.toLocaleString()}</span>
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
              <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] relative">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center text-2xl font-bold text-white uppercase bg-black"
                  >
                    {userProfile?.avatar || userProfile?.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black font-display uppercase tracking-wider flex items-center gap-1.5">
                      {userProfile?.name}
                      <span className="text-[10px] bg-neutral-100 text-black border-2 border-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono font-bold">
                        Educator
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-500">
                      ✉️ {userProfile?.email}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-6 pt-6 border-t-2 border-neutral-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs text-black font-bold focus:outline-none focus:bg-neutral-50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Session Fee (₹)</label>
                        <input
                          type="tel"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value.replace(/[^0-9]/g, ""))}
                          className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs text-black font-bold focus:outline-none focus:bg-neutral-50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Experience Level</label>
                        <input
                          type="text"
                          value={editExp}
                          onChange={(e) => setEditExp(e.target.value)}
                          className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs text-black font-bold focus:outline-none focus:bg-neutral-50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Credentials</label>
                        <input
                          type="text"
                          value={editQual}
                          onChange={(e) => setEditQual(e.target.value)}
                          className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs text-black font-bold focus:outline-none focus:bg-neutral-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Biographical Bio Intro</label>
                      <textarea
                        rows={3}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs text-black font-bold focus:outline-none focus:bg-neutral-50 resize-none font-sans"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 py-1.5 bg-black hover:bg-neutral-900 border-2 border-black text-white text-xs font-bold font-display uppercase tracking-wide rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] cursor-pointer"
                      >
                        Save Settings
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-1.5 bg-white hover:bg-neutral-50 border-2 border-black text-black text-xs font-bold font-display uppercase tracking-wide rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t-2 border-neutral-100 grid grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">LOCATION</span>
                      <strong className="text-black mt-1 block font-bold">{userProfile?.city || "Not Registered"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">TEACHING LEVEL</span>
                      <strong className="text-black mt-1 block font-bold">{userProfile?.grade || "All Grades"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">CLASS CHARGE</span>
                      <strong className="text-black mt-1 block font-mono font-bold">₹{userProfile?.rate || 0}/class</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">CREDENTIALS</span>
                      <strong className="text-black mt-1 block font-bold truncate">{userProfile?.qual || "Trained Educator"}</strong>
                    </div>
                    <div className="col-span-2 pt-1">
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">BIO DETAILS</span>
                      <p className="text-neutral-700 mt-1 leading-relaxed text-xs italic">{userProfile?.bio || "No custom biography statement set."}</p>
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
                        className="w-full py-2 bg-white hover:bg-neutral-50 text-black border-2 border-black text-xs font-bold font-display uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(75,85,99,1)]"
                      >
                        <Edit size={13} />
                        Update settings
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black z-40 py-2 px-4 shadow-[0_-2px_6px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          <button
            onClick={() => { setActiveTab("overview"); setActiveChatId(null); }}
            className={`py-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "overview" ? "text-white bg-black font-extrabold" : "text-neutral-500 hover:text-black"
            }`}
          >
            <Activity size={16} />
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Overview</span>
          </button>
          <button
            onClick={() => { setActiveTab("requests"); setActiveChatId(null); }}
            className={`py-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all relative ${
              activeTab === "requests" ? "text-white bg-black font-extrabold" : "text-neutral-500 hover:text-black"
            }`}
          >
            <Users size={16} />
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Requests</span>
            {pendingRequests.length > 0 && (
              <span className="absolute top-2 right-6 w-2 h-2 bg-black border border-white rounded-full" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab("chats"); }}
            className={`py-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all relative ${
              activeTab === "chats" ? "text-white bg-black font-extrabold" : "text-neutral-500 hover:text-black"
            }`}
          >
            <MessageSquare size={16} />
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Dialogs</span>
            {chats.some(c => c.tutorUnread && c.tutorUnread > 0) && (
              <span className="absolute top-2 right-6 w-2 h-2 bg-black border border-white rounded-full animate-ping" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab("wallet"); setActiveChatId(null); }}
            className={`py-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "wallet" ? "text-white bg-black font-extrabold" : "text-neutral-500 hover:text-black"
            }`}
          >
            <Wallet size={16} />
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Earning</span>
          </button>
          <button
            onClick={() => { setActiveTab("profile"); setActiveChatId(null); }}
            className={`py-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "profile" ? "text-white bg-black font-extrabold" : "text-neutral-500 hover:text-black"
            }`}
          >
            <User size={16} />
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
