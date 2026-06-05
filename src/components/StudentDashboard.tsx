import React, { useState } from "react";
import { useFirebase, safeStorage } from "../FirebaseContext";
import { SUBJECTS, GRADES, MODES, cityScore } from "../constants";
import { 
  Search, MapPin, Star, Calendar, MessageSquare, 
  Wallet, User, LogOut, CheckCircle2, PlusCircle, 
  Activity, Edit, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (!userProfile?.uid) return [];
    return safeStorage.parseItem<string[]>(`tutorfind_favorites_${userProfile.uid}`, []);
  });

  const toggleFavorite = (tutorUid: string) => {
    if (!userProfile?.uid) return;
    const favoritesKey = `tutorfind_favorites_${userProfile.uid}`;
    let newFavorites;
    if (favorites.includes(tutorUid)) {
      newFavorites = favorites.filter((id) => id !== tutorUid);
      triggerToast("Removed from bookmarked favorites.");
    } else {
      newFavorites = [...favorites, tutorUid];
      triggerToast("Added to bookmarked favorites! ❤️");
    }
    setFavorites(newFavorites);
    safeStorage.setItem(favoritesKey, JSON.stringify(newFavorites));
  };

  // Profile Edit Buffer
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.name || "");
  const [editPhone, setEditPhone] = useState(userProfile?.phone || "");
  const [editCity, setEditCity] = useState(userProfile?.city || "");
  const [editMaxFee, setEditMaxFee] = useState(userProfile?.maxFee ? String(userProfile.maxFee) : "500");

  const handleSaveProfile = async () => {
    if (!editName || !editCity) {
      triggerToast("Name and City are required.");
      return;
    }
    await useFirebase().updateProfile({
      name: editName,
      phone: editPhone,
      city: editCity,
      maxFee: Number(editMaxFee) || 500
    });
    setIsEditing(false);
  };

  const myCity = userProfile?.city || "";

  // Dynamic filter algorithms applying local proximity
  const filteredTutors = tutors.filter(t => {
    const isFavorited = favorites.includes(t.uid);
    if (showFavoritesOnly && !isFavorited) return false;

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
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      {/* HEADER BANNER */}
      <header className="sticky top-0 bg-white border-b-2 border-black z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-black border-2 border-black flex items-center justify-center text-xl shadow-sm text-white">
              📚
            </div>
            <div>
              <h1 className="text-base font-bold font-display tracking-tight text-black uppercase leading-tight">TutorFind India</h1>
              <p className="text-[10px] text-neutral-600 font-mono flex items-center gap-0.5 mt-0.5">
                <MapPin size={10} className="text-black" /> Student: <strong>{userProfile?.city || "India"}</strong>
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
          {activeTab === "find" && (
            <motion.div 
              key="find"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search Panel */}
              <div className="bg-white rounded-xl border-2 border-black p-4 space-y-4 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-3.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search certified tutors, school subjects, or city locations..."
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-black rounded-lg text-black text-sm focus:outline-none focus:bg-neutral-50 font-sans transition-all"
                  />
                </div>

                {/* Subject Selector Strip */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                  <button
                    onClick={() => setSelectedSubject("")}
                    className={`py-1 px-3 rounded text-xs font-bold font-display uppercase tracking-wider whitespace-nowrap transition-all border-2 ${
                      !selectedSubject 
                        ? "bg-black border-black text-white" 
                        : "bg-white border-neutral-200 text-neutral-500 hover:border-black hover:text-black"
                    }`}
                  >
                    All Subjects
                  </button>
                  {SUBJECTS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSubject(s === selectedSubject ? "" : s)}
                      className={`py-1 px-3 rounded text-xs font-bold font-display uppercase tracking-wider whitespace-nowrap transition-all border-2 ${
                        s === selectedSubject 
                          ? "bg-black border-black text-white" 
                          : "bg-white border-neutral-200 text-neutral-500 hover:border-black hover:text-black"
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
                    className="py-2 px-2.5 bg-white text-black border-2 border-black rounded-lg text-xs font-bold focus:outline-none focus:bg-neutral-50 cursor-pointer"
                  >
                    <option value="">Any Grade</option>
                    {GRADES.map((g, idx) => <option key={idx} value={g}>{g}</option>)}
                  </select>
                  <select
                    value={selectedModeFilter}
                    onChange={(e) => setSelectedModeFilter(e.target.value)}
                    className="py-2 px-2.5 bg-white text-black border-2 border-black rounded-lg text-xs font-bold focus:outline-none focus:bg-neutral-50 cursor-pointer"
                  >
                    <option value="">Any Mode</option>
                    {MODES.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={selectedLimitFee}
                    onChange={(e) => setSelectedLimitFee(Number(e.target.value))}
                    className="py-2 px-2.5 bg-white text-black border-2 border-black rounded-lg text-xs font-bold focus:outline-none focus:bg-neutral-50 cursor-pointer"
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-700 font-mono tracking-wider font-bold">
                  <div className="flex items-center gap-3">
                    <span>DISCOVER TUTORS ({filteredTutors.length})</span>
                    <button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className={`px-2.5 py-1 border-2 border-black rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                        showFavoritesOnly 
                          ? "bg-red-500 text-white" 
                          : "bg-white text-black hover:bg-neutral-100"
                      }`}
                    >
                      <Heart size={10} fill={showFavoritesOnly ? "currentColor" : "none"} />
                      <span>{showFavoritesOnly ? "Favorites Only" : "Show Favorites"}</span>
                    </button>
                  </div>
                  <span>📍 Closest Indian Tutors First</span>
                </div>

                {filteredTutors.length === 0 ? (
                  <div className="py-12 text-center bg-white rounded-xl border-2 border-black">
                    <p className="text-neutral-400 mb-4 text-3xl">🧩</p>
                    <h3 className="text-black font-bold font-display uppercase tracking-wide">No tutors match filters</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto font-sans">
                      Try expanding budget limits, changing academic modes, or looking up certified teachers across nearby zones.
                    </p>
                  </div>
                ) : (
                  filteredTutors.map((tutor) => {
                    const localScore = cityScore(tutor.city || "", myCity);
                    return (
                      <motion.div
                      layout
                        key={tutor.uid}
                        className="bg-white border-2 border-black rounded-lg p-5 hover:bg-neutral-50 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(75,85,99,1)] transition-all relative overflow-hidden"
                      >
                        {/* Status Rate & Favorite Button */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(tutor.uid);
                            }}
                            className={`p-1.5 border-2 border-black rounded-full transition-all cursor-pointer flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(75,85,99,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                              favorites.includes(tutor.uid) 
                                ? "bg-red-500 text-white hover:bg-red-600" 
                                : "bg-white text-black hover:bg-neutral-50"
                            }`}
                            title={favorites.includes(tutor.uid) ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Heart size={11} fill={favorites.includes(tutor.uid) ? "currentColor" : "none"} className={favorites.includes(tutor.uid) ? "text-white" : "text-black"} />
                          </button>
                          <div className="bg-black text-white hover:bg-neutral-900 border-2 border-black py-0.5 px-2.5 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider">
                            ₹{tutor.rate}/class
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div 
                            className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-bold text-white uppercase relative flex-shrink-0 bg-black"
                          >
                            {tutor.avatar || tutor.name.slice(0, 2)}
                            {tutor.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-neutral-900 border-2 border-white rounded-full" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 onClick={() => {
                                const idx = tutors.findIndex(x => x.uid === tutor.uid);
                                if (idx !== -1) {
                                  onSelectTutor(idx + 1);
                                }
                              }} className="font-bold text-black font-display text-lg cursor-pointer hover:underline transition-all">
                                {tutor.name}
                              </h3>
                              {localScore === 0 ? (
                                <span className="text-[9px] font-bold text-black bg-neutral-100 border-2 border-black py-0.5 px-2 rounded-full font-mono uppercase tracking-wide">
                                  In Your City
                                </span>
                              ) : localScore === 1 ? (
                                <span className="text-[9px] font-bold text-black bg-neutral-100 border border-neutral-300 py-0.5 px-2 rounded-full font-mono uppercase tracking-wide">
                                  State Proxy
                                </span>
                              ) : null}
                            </div>

                            <p className="text-neutral-600 text-xs font-semibold">
                              📍 {tutor.city || "India"} &nbsp;·&nbsp; {tutor.exp || "0 years"} Experience &nbsp;·&nbsp; {tutor.qual || "Educator"}
                            </p>

                            <div className="flex items-center gap-1 text-xs text-black font-bold py-0.5">
                              <Star size={12} fill="currentColor" className="text-black" />
                              <span>{tutor.rating || "5.0"}</span>
                              <span className="text-[10px] text-neutral-500 font-normal">({tutor.reviewsCount || 0} reviews)</span>
                            </div>

                            {/* Subjects Tags */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {(tutor.subjects || []).map((sub, i) => (
                                <span key={i} className="text-[9px] bg-neutral-100 text-neutral-800 py-0.5 px-2 rounded font-bold font-mono border border-neutral-300">
                                  {sub}
                                </span>
                              ))}
                              <span className="text-[9px] bg-black text-white py-0.5 px-2 rounded font-bold font-mono border border-black">
                                {tutor.mode}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card bottom CTA */}
                        <div className="mt-5 pt-4 border-t-2 border-neutral-100 flex gap-2">
                          <button
                            onClick={async () => {
                              const rId = await useFirebase().createChatRoom(tutor.uid);
                              setActiveChatId(rId);
                              setActiveTab("chats");
                            }}
                            className="flex-1 py-1.5 text-xs bg-white border-2 border-black hover:bg-neutral-100 text-black rounded-md cursor-pointer font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide"
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
                            className="flex-1 py-1.5 text-xs bg-black hover:bg-neutral-900 text-white rounded-md cursor-pointer font-bold transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] uppercase tracking-wide border-2 border-black"
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
              <h2 className="text-xl font-bold font-display text-black uppercase tracking-tight mb-2">My Bookings History</h2>

              {studentBookings.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-xl border-2 border-black">
                  <p className="text-neutral-400 text-3xl mb-4">🗓️</p>
                  <h3 className="text-black font-bold font-display uppercase tracking-wider">No lectures booked yet</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Book your first tutor by filtering subjects in the Find dashboard.
                  </p>
                </div>
              ) : (
                studentBookings.map((book) => (
                  <div key={book.id} className="bg-white border-2 border-black rounded-lg p-5 shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] space-y-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-white uppercase bg-black"
                      >
                        {book.tutorAvatar || "T"}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-black">{book.tutorName}</h4>
                        <p className="text-xs text-neutral-500 font-semibold">{book.subject}</p>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider py-1 px-2.5 border-2 rounded-full ${
                        book.status === "confirmed" 
                          ? "bg-black text-white border-black"
                          : book.status === "pending"
                          ? "bg-neutral-100 text-black border-black"
                          : "bg-white text-neutral-400 border-neutral-300"
                      }`}>
                        {book.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t-2 border-neutral-100 pb-1 font-sans">
                      <div className="p-2 bg-neutral-50 border-2 border-black rounded-lg text-center">
                        <span className="block text-[8px] font-extrabold text-neutral-500 tracking-wider font-mono">DATE</span>
                        <span className="text-xs text-black font-bold">{book.date}</span>
                      </div>
                      <div className="p-2 bg-neutral-50 border-2 border-black rounded-lg text-center">
                        <span className="block text-[8px] font-extrabold text-neutral-500 tracking-wider font-mono">TIME</span>
                        <span className="text-xs text-black font-bold">{book.time}</span>
                      </div>
                      <div className="p-2 bg-neutral-50 border-2 border-black rounded-lg text-center">
                        <span className="block text-[8px] font-extrabold text-neutral-500 tracking-wider font-mono">MODE</span>
                        <span className="text-xs text-black font-bold">{book.mode}</span>
                      </div>
                      <div className="p-2 bg-neutral-50 border-2 border-black rounded-lg text-center">
                        <span className="block text-[8px] font-extrabold text-neutral-500 tracking-wider font-mono">RATE LOCKED</span>
                        <span className="text-xs text-black font-bold font-mono">₹{book.rate}</span>
                      </div>
                    </div>

                    {book.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateBookingStatus(book.id, "cancelled")}
                          className="flex-1 py-1.5 text-neutral-500 hover:text-black hover:border-black bg-white border border-neutral-300 text-xs font-bold rounded cursor-pointer"
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
              <h2 className="text-xl font-bold font-display text-black uppercase tracking-tight mb-2">My Live Dialogues</h2>

              {chats.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-xl border-2 border-black">
                  <p className="text-neutral-400 text-3xl mb-4">💬</p>
                  <h3 className="text-black font-bold font-display uppercase tracking-wider">No active dialogs</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Click "Chat Instant" on tutor profiles to initiate secure Indian matching conversations.
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
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-4 ${
                        hasUnread 
                          ? "bg-neutral-50 border-black shadow-md font-bold" 
                          : "bg-white border-neutral-300 hover:border-black"
                      }`}
                    >
                      <div 
                        className="w-11 h-11 rounded-full border-2 border-black flex items-center justify-center font-bold text-white uppercase relative bg-black flex-shrink-0"
                      >
                        {c.tutorAvatar || "T"}
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black rounded-full border border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-black">
                            {c.tutorName}
                          </h4>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {new Date(c.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 truncate ${hasUnread ? "text-black font-bold" : "text-neutral-500"}`}>
                          {c.lastMsg}
                        </p>
                      </div>

                      <span className="text-xs text-black flex items-center justify-center w-6 h-6 border-2 border-black rounded-lg font-bold">
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
              <div className="bg-white border-2 border-black rounded-xl p-6 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
                <span className="text-[10px] font-bold tracking-wider font-mono text-neutral-500 uppercase">My Credit Balance</span>
                <h3 className="text-4xl font-bold font-display text-black mt-1.5 flex items-baseline gap-1 uppercase">
                  ₹{userProfile?.walletBalance || 0}
                  <span className="text-xs text-neutral-500 font-normal font-sans">available INR credits</span>
                </h3>

                <p className="text-xs text-neutral-600 mt-2 font-sans tracking-wide">
                  Instantly book lessons with security-vetted educators across India. Deductions are processed securely on session confirmation.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-5 border-t-2 border-neutral-100 mt-5">
                  <button 
                    onClick={() => addFunding(500)}
                    className="py-3 px-4 bg-black hover:bg-neutral-900 border-2 border-black text-white font-bold text-xs rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] uppercase tracking-wide"
                  >
                    <PlusCircle size={14} /> Add ₹500
                  </button>
                  <button 
                    onClick={() => addFunding(1000)}
                    className="py-3 px-4 bg-white hover:bg-neutral-50 text-black font-bold text-xs rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-2 border-2 border-black uppercase tracking-wide"
                  >
                    <PlusCircle size={14} /> Add ₹1000
                  </button>
                </div>
              </div>

              {/* Transactions Logs */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-black tracking-wider uppercase">
                  <Activity size={12} className="text-black" />
                  <span>TRANSACTION LOGS</span>
                </div>

                <div className="bg-white rounded-xl border-2 border-black p-4 space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-between text-xs p-2 border-b-2 border-neutral-100 pb-2 text-black">
                    <span className="font-bold uppercase tracking-wider">Initial App Gift Credits</span>
                    <span className="font-mono font-bold text-black">+ ₹2,500</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 text-neutral-500 italic">
                    <span>Session debits update here instantly</span>
                    <span className="font-mono text-neutral-400">Secure matching</span>
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
                        Student
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
                          className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs text-black font-bold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">City / Location</label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs text-black font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Phone</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                          placeholder="10 digit phone contact"
                          className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs text-black font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Max Session Budget (₹)</label>
                        <input
                          type="text"
                          pattern="[0-9]*"
                          value={editMaxFee}
                          onChange={(e) => setEditMaxFee(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="e.g. 500"
                          className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs text-black font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 py-2 bg-black hover:bg-neutral-950 text-white text-xs font-bold font-display uppercase tracking-wide rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] cursor-pointer"
                      >
                        Save Configuration
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2 bg-white hover:bg-neutral-50 border-2 border-black text-black text-xs font-bold font-display uppercase tracking-wide rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t-2 border-neutral-100 grid grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">LOCATION</span>
                      <strong className="text-black mt-1 block font-bold">{userProfile?.city || "Not Shared"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">CLASS / ACADEMIC LEVEL</span>
                      <strong className="text-black mt-1 block font-bold">{userProfile?.grade || "Not Configured"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">PHONE</span>
                      <strong className="text-black mt-1 block font-mono font-bold">{userProfile?.phone ? "+91 " + userProfile.phone : "Not Verified"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">TARGET SUBJECTS</span>
                      <strong className="text-black mt-1 block font-bold truncate">{(userProfile?.subjects || []).join(", ") || "None selected"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-extrabold text-neutral-500 tracking-wider font-mono">MAX BUDGET</span>
                      <strong className="text-black mt-1 block font-mono font-bold">₹{userProfile?.maxFee ? userProfile.maxFee : "500"} / session</strong>
                    </div>

                    <div className="col-span-2 pt-2">
                      <button
                        onClick={() => {
                          setEditName(userProfile?.name || "");
                          setEditCity(userProfile?.city || "");
                          setEditPhone(userProfile?.phone || "");
                          setEditMaxFee(userProfile?.maxFee ? String(userProfile.maxFee) : "500");
                          setIsEditing(true);
                        }}
                        className="w-full py-2 bg-white hover:bg-neutral-50 text-black border-2 border-black text-xs font-bold font-display uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(75,85,99,1)]"
                      >
                        <Edit size={13} />
                        Modify Profile Details
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
            onClick={() => { setActiveTab("find"); setActiveChatId(null); }}
            className={`py-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "find" ? "text-white bg-black font-extrabold" : "text-neutral-500 hover:text-black"
            }`}
          >
            <Search size={16} />
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Find</span>
          </button>
          <button
            onClick={() => { setActiveTab("bookings"); setActiveChatId(null); }}
            className={`py-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "bookings" ? "text-white bg-black font-extrabold" : "text-neutral-500 hover:text-black"
            }`}
          >
            <Calendar size={16} />
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Lessons</span>
          </button>
          <button
            onClick={() => { setActiveTab("chats"); }}
            className={`py-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all relative ${
              activeTab === "chats" ? "text-white bg-black font-extrabold" : "text-neutral-500 hover:text-black"
            }`}
          >
            <MessageSquare size={16} />
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Dialogs</span>
            {chats.some(c => c.studentUnread && c.studentUnread > 0) && (
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
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Wallet</span>
          </button>
          <button
            onClick={() => { setActiveTab("profile"); setActiveChatId(null); }}
            className={`py-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none transition-all ${
              activeTab === "profile" ? "text-white bg-black font-extrabold" : "text-neutral-500 hover:text-black"
            }`}
          >
            <User size={16} />
            <span className="text-[9px] font-display uppercase tracking-widest font-bold scale-90">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
