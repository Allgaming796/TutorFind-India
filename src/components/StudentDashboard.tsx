import React, { useState } from "react";
import { useFirebase } from "../FirebaseContext";
import { SUBJECTS, GRADES, MODES, cityScore } from "../constants";
import { 
  Search, SlidersHorizontal, MapPin, Star, Calendar, MessageSquare, 
  Wallet, User, LogOut, CheckCircle2, RefreshCw, PlusCircle, ArrowUpRight, 
  HelpCircle, Sparkles, BookOpen, Clock, Activity, Edit
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Booking } from "../types";

interface StudentDashboardProps {
  onSelectTutor: (tId: number) => void;
  onBookTutor: (tId: number) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onSelectTutor, onBookTutor }) => {
  const { 
    userProfile, 
    tutors, 
    bookings, 
    chats, 
    logOut, 
    addFunding, 
    setActiveChatId, 
    updateBookingStatus,
    triggerToast
  } = useFirebase();

  const [activeTab, setActiveTab] = useState<"find" | "bookings" | "chats" | "wallet" | "profile">("find");
  const [searchQ, setSearchQ] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("");
  const [selectedModeFilter, setSelectedModeFilter] = useState("");
  const [selectedLimitFee, setSelectedLimitFee] = useState(1000);

  // Profile Edit Buffer
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name || "");
  const [editPhone, setEditPhone] = useState(userProfile?.phone || "");
  const [editCity, setEditCity] = useState(userProfile?.city || "");

  const handleSaveProfile = async () => {
    if (!editName || !editCity) {
      triggerToast("Name and City are required.");
      return;
    }
    await useFirebase().updateProfile({
      name: editName,
      phone: editPhone,
      city: editCity
    });
    setIsEditing(false);
  };

  const myCity = userProfile?.city || "";

  // Dynamic filter algorithms applying local proximity
  const filteredTutors = tutors.filter(t => {
    const matchesSearch = !searchQ || 
      t.name.toLowerCase().includes(searchQ.toLowerCase()) || 
      (t.city && t.city.toLowerCase().includes(searchQ.toLowerCase())) || 
      (t.subjects && t.subjects.some(sub => sub.toLowerCase().includes(searchQ.toLowerCase())));
    
    const matchesSubject = !selectedSubject || (t.subjects && t.subjects.includes(selectedSubject));
    const matchesGrade = !selectedGradeFilter || (t.grade && t.grade.includes(selectedGradeFilter));
    const matchesMode = !selectedModeFilter || t.mode === selectedModeFilter || t.mode === "Both";
    const matchesFee = !t.rate || t.rate <= selectedLimitFee;

    return matchesSearch && matchesSubject && matchesGrade && matchesMode && matchesFee;
  }).sort((a, b) => {
    // Sort proximal (your city first, then state-proximal, then rest)
    return cityScore(a.city || "", myCity) - cityScore(b.city || "", myCity);
  });

  const studentBookings = bookings.filter(b => b.studentId === userProfile?.uid);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER BANNER */}
      <header className="sticky top-0 bg-slate-900 border-b border-slate-800 z-40 px-4 py-3 shadow-lg shadow-black/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xl shadow-inner">
              📚
            </div>
            <div>
              <h1 className="text-sm font-bold font-display tracking-tight text-white leading-tight">TutorFind India</h1>
              <p className="text-[10px] text-slate-400 font-sans flex items-center gap-0.5">
                <MapPin size={10} className="text-indigo-400" /> student in <strong>{userProfile?.city || "India"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setActiveTab("wallet")}
              className="py-1.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/30 rounded-xl flex items-center gap-1.5 transition-all text-xs font-mono font-bold text-slate-200"
            >
              <Wallet size={12} className="text-indigo-400" />
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
          {activeTab === "find" && (
            <motion.div 
              key="find"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search Panel */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-xl">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search master tutors, subject topics, or city locations..."
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-sans transition-all"
                  />
                </div>

                {/* Subject Selector Strip */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                  <button
                    onClick={() => setSelectedSubject("")}
                    className={`py-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                      !selectedSubject 
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    All Subjects
                  </button>
                  {SUBJECTS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSubject(s === selectedSubject ? "" : s)}
                      className={`py-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                        s === selectedSubject 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md" 
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* More Filters */}
                <div className="grid grid-cols-3 gap-2 pt-1.5">
                  <select
                    value={selectedGradeFilter}
                    onChange={(e) => setSelectedGradeFilter(e.target.value)}
                    className="py-2 px-2.5 bg-slate-950 text-slate-400 border border-slate-800 rounded-lg text-[11px] focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Any Grade</option>
                    {GRADES.map((g, idx) => <option key={idx} value={g}>{g}</option>)}
                  </select>
                  <select
                    value={selectedModeFilter}
                    onChange={(e) => setSelectedModeFilter(e.target.value)}
                    className="py-2 px-2.5 bg-slate-950 text-slate-400 border border-slate-800 rounded-lg text-[11px] focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Any Mode</option>
                    {MODES.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={selectedLimitFee}
                    onChange={(e) => setSelectedLimitFee(Number(e.target.value))}
                    className="py-2 px-2.5 bg-slate-950 text-slate-400 border border-slate-800 rounded-lg text-[11px] focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="1000">Fee ≤ ₹1,000</option>
                    <option value="600">Fee ≤ ₹600</option>
                    <option value="400">Fee ≤ ₹400</option>
                    <option value="300">Fee ≤ ₹300</option>
                  </select>
                </div>
              </div>

              {/* Tutors Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono tracking-wider font-semibold">
                  <span>DISCOVER TUTORS ({filteredTutors.length})</span>
                  <span>📍 Showing closest first</span>
                </div>

                {filteredTutors.length === 0 ? (
                  <div className="py-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
                    <HelpCircle className="mx-auto mb-4 text-slate-600" size={32} />
                    <h3 className="text-slate-300 font-bold">No matching tutors found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Adjust your search triggers, limit budget filters, or look up nearby cities instead.
                    </p>
                  </div>
                ) : (
                  filteredTutors.map((tutor) => {
                    const localScore = cityScore(tutor.city || "", myCity);
                    return (
                      <motion.div
                        key={tutor.uid}
                        layout
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 shadow-xl transition-all relative overflow-hidden"
                      >
                        {/* Status Label */}
                        <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-950 py-1 px-2.5 border border-slate-800 rounded-full font-mono text-[9px] text-indigo-400 font-bold">
                          ₹{tutor.rate}/class
                        </div>

                        <div className="flex items-start gap-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white uppercase relative flex-shrink-0 shadow-lg"
                            style={{ backgroundColor: tutor.color || "#4f46e5" }}
                          >
                            {tutor.avatar || tutor.name.slice(0, 2)}
                            {tutor.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border border-slate-900 rounded-full" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 onClick={() => {
                                // Save selection state
                                const idx = tutors.findIndex(x => x.uid === tutor.uid);
                                if (idx !== -1) {
                                  onSelectTutor(idx + 1);
                                }
                              }} className="font-bold text-white font-display text-base cursor-pointer hover:text-indigo-400 transition-all">
                                {tutor.name}
                              </h3>
                              {localScore === 0 ? (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-0.5 px-2 rounded-full">
                                  In Your City
                                </span>
                              ) : localScore === 1 ? (
                                <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 py-0.5 px-2 rounded-full">
                                  State Proxy
                                </span>
                              ) : null}
                            </div>

                            <p className="text-slate-400 text-xs font-sans">
                              📍 {tutor.city || "India"} &nbsp;·&nbsp; {tutor.exp || "0 years"} Exp &nbsp;·&nbsp; {tutor.qual || "Educator"}
                            </p>

                            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold py-0.5">
                              <Star size={12} fill="currentColor" />
                              <span>{tutor.rating || "5.0"}</span>
                              <span className="text-[10px] text-slate-500">({tutor.reviewsCount || 0} reviews)</span>
                            </div>

                            {/* Subjects tags */}
                            <div className="flex flex-wrap gap-1.5 pt-1.5">
                              {(tutor.subjects || []).map((sub, i) => (
                                <span key={i} className="text-[10px] bg-slate-950 text-slate-400 py-0.5 px-2 rounded-md font-mono border border-slate-800">
                                  {sub}
                                </span>
                              ))}
                              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 py-0.5 px-2 rounded-md font-mono border border-indigo-500/20">
                                {tutor.mode}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card bottom CTA */}
                        <div className="mt-5 pt-4 border-t border-slate-800/60 flex gap-2">
                          <button
                            onClick={async () => {
                              const rId = await useFirebase().createChatRoom(tutor.uid);
                              setActiveChatId(rId);
                              setActiveTab("chats");
                            }}
                            className="flex-1 py-2 text-xs bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer text-slate-300 font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare size={13} />
                            Chat Instant
                          </button>
                          <button
                            onClick={() => {
                              const tIdx = tutors.findIndex(x => x.uid === tutor.uid);
                              if (tIdx !== -1) {
                                onBookTutor(tIdx + 1);
                              }
                            }}
                            className="flex-1 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15"
                          >
                            <Calendar size={13} />
                            Book Session
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "bookings" && (
            <motion.div 
              key="bookings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold font-display text-white mb-2">My Bookings History</h2>

              {studentBookings.length === 0 ? (
                <div className="py-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
                  <Calendar className="mx-auto mb-4 text-slate-600" size={32} />
                  <h3 className="text-slate-300 font-bold">No bookings recorded yet</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Book your first tutor by filtering subjects in the Find dashboard
                  </p>
                </div>
              ) : (
                studentBookings.map((book) => (
                  <div key={book.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner"
                        style={{ backgroundColor: book.tutorColor || "#4f46e5" }}
                      >
                        {book.tutorAvatar || "T"}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-white">{book.tutorName}</h4>
                        <p className="text-xs text-slate-500 font-sans">{book.subject}</p>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider py-1 px-2.5 rounded-full ${
                        book.status === "confirmed" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : book.status === "pending"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : book.status === "cancelled"
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-slate-950 text-slate-400 border border-slate-850"
                      }`}>
                        {book.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-slate-800/60 pb-1 font-sans">
                      <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-center">
                        <span className="block text-[8px] font-bold text-slate-500 tracking-wider font-mono">DATE</span>
                        <span className="text-xs text-slate-300 font-semibold">{book.date}</span>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-center">
                        <span className="block text-[8px] font-bold text-slate-500 tracking-wider font-mono">TIME</span>
                        <span className="text-xs text-slate-300 font-semibold">{book.time}</span>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-center">
                        <span className="block text-[8px] font-bold text-slate-500 tracking-wider font-mono">MODE</span>
                        <span className="text-xs text-slate-300 font-semibold">{book.mode}</span>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-center">
                        <span className="block text-[8px] font-bold text-slate-500 tracking-wider font-mono">RATE LOCKED</span>
                        <span className="text-xs text-slate-300 font-semibold font-mono">₹{book.rate}</span>
                      </div>
                    </div>

                    {book.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateBookingStatus(book.id, "cancelled")}
                          className="flex-1 py-1.5 text-slate-400 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cancel Request
                        </button>
                      </div>
                    )}
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
              <h2 className="text-xl font-bold font-display text-white mb-2">My Live Dialogues</h2>

              {chats.length === 0 ? (
                <div className="py-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
                  <MessageSquare className="mx-auto mb-4 text-slate-600" size={32} />
                  <h3 className="text-slate-300 font-bold">No active conversations</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Click "Chat Instant" on tutor profiles to trigger secure real-time messaging
                  </p>
                </div>
              ) : (
                chats.map((c) => {
                  const hasUnread = c.studentUnread && c.studentUnread > 0;
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
                          : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      <div 
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white uppercase shadow flex-shrink-0 relative"
                        style={{ backgroundColor: c.tutorColor || "#4f46e5" }}
                      >
                        {c.tutorAvatar || "T"}
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full animate-pulse border border-slate-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-bold ${hasUnread ? "text-indigo-300" : "text-white"}`}>
                            {c.tutorName}
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
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                {/* Glow decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

                <span className="text-[10px] font-bold tracking-wider font-mono text-indigo-400 uppercase">My Credit Balance</span>
                <h3 className="text-4xl font-bold font-display text-white mt-1.5 flex items-baseline gap-1">
                  ₹{userProfile?.walletBalance || 0}
                  <span className="text-xs text-slate-500 font-normal font-sans">available credits</span>
                </h3>

                <p className="text-xs text-slate-400 mt-2 font-sans">
                  Instantly book lessons with security-vetted educators across India. Deductions are processed securely on session confirmation.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-800/60 mt-5">
                  <button 
                    onClick={() => addFunding(500)}
                    className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 border border-indigo-500/30"
                  >
                    <PlusCircle size={14} /> Add ₹500 Test Money
                  </button>
                  <button 
                    onClick={() => addFunding(1000)}
                    className="py-3 px-4 bg-slate-950 hover:bg-slate-900 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 border border-slate-850"
                  >
                    <PlusCircle size={14} /> Add ₹1000 Premium
                  </button>
                </div>
              </div>

              {/* Transactions logs */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 tracking-wider">
                  <Activity size={12} className="text-indigo-400" />
                  <span>TRANSACTION HISTORY</span>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs p-2 border-b border-slate-850 pb-2 text-slate-400">
                    <span className="font-semibold text-white">Initial Gift Credits</span>
                    <span className="font-mono text-emerald-400">+ ₹2,500</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 text-slate-400 italic">
                    <span>Session debits log here in real-time</span>
                    <span className="font-mono text-slate-500">Secure</span>
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
                    style={{ backgroundColor: userProfile?.color || "#10b981" }}
                  >
                    {userProfile?.avatar || userProfile?.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display flex items-center gap-1.5">
                      {userProfile?.name}
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        Student
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
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">City / Location</label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Phone (for OTP verification)</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                        placeholder="10 digit number"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl scroll-smooth"
                      >
                        Save Profiles
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
                      <span className="block text-[9px] font-bold text-slate-500 tracking-wider font-mono">CLASS / LEVEL</span>
                      <strong className="text-slate-300 mt-1 block">{userProfile?.grade || "Not Configured"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-500 tracking-wider font-mono">PHONE</span>
                      <strong className="text-slate-300 mt-1 block">{userProfile?.phone ? "+91 " + userProfile.phone : "Not Verified"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-500 tracking-wider font-mono">TARGET SUBJECTS</span>
                      <strong className="text-slate-300 mt-1 block truncate">{(userProfile?.subjects || []).join(", ") || "None selected"}</strong>
                    </div>

                    <div className="col-span-2 pt-2">
                      <button
                        onClick={() => {
                          setEditName(userProfile?.name || "");
                          setEditCity(userProfile?.city || "");
                          setEditPhone(userProfile?.phone || "");
                          setIsEditing(true);
                        }}
                        className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850 hover:border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit size={13} />
                        Edit Profile Details
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
            onClick={() => { setActiveTab("find"); setActiveChatId(null); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "find" ? "text-indigo-400 bg-indigo-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Search size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Find</span>
          </button>
          <button
            onClick={() => { setActiveTab("bookings"); setActiveChatId(null); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "bookings" ? "text-indigo-400 bg-indigo-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Calendar size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Lessons</span>
          </button>
          <button
            onClick={() => { setActiveTab("chats"); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all relative ${
              activeTab === "chats" ? "text-indigo-400 bg-indigo-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <MessageSquare size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Dialogues</span>
            {chats.some(c => c.studentUnread && c.studentUnread > 0) && (
              <span className="absolute top-2.5 right-6 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab("wallet"); setActiveChatId(null); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "wallet" ? "text-indigo-400 bg-indigo-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Wallet size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Wallet</span>
          </button>
          <button
            onClick={() => { setActiveTab("profile"); setActiveChatId(null); }}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "profile" ? "text-indigo-400 bg-indigo-500/5 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <User size={18} />
            <span className="text-[9px] font-display uppercase tracking-wider scale-90">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
