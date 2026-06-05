import React, { useState } from "react";
import { useFirebase } from "../FirebaseContext";
import { SUBJECTS, GRADES, MODES, CITIES } from "../constants";
import { MapPin, BookOpen, Layers, IndianRupee, Briefcase, Award, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export const ProfileSetup: React.FC = () => {
  const { userProfile, updateProfile, logOut, triggerToast } = useFirebase();
  const isTutor = userProfile?.role === "tutor";

  // Shared state
  const [city, setCity] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [cityMatches, setCityMatches] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [avatar, setAvatar] = useState("");

  // Tutor Specific
  const [fee, setFee] = useState("");
  const [mode, setMode] = useState<"Online" | "Offline" | "Both">("Both");
  const [exp, setExp] = useState("");
  const [qual, setQual] = useState("");
  const [bio, setBio] = useState("");

  // Student Specific
  const [maxFee, setMaxFee] = useState("500");

  const handleCityInput = (val: string) => {
    setCityQuery(val);
    if (!val) {
      setCityMatches([]);
      return;
    }
    const matches = CITIES.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
    setCityMatches(matches);
  };

  const selectCity = (c: string) => {
    setCity(c);
    setCityQuery(c);
    setCityMatches([]);
  };

  const toggleSubject = (s: string) => {
    if (selectedSubjects.includes(s)) {
      setSelectedSubjects(selectedSubjects.filter(sub => sub !== s));
    } else {
      setSelectedSubjects([...selectedSubjects, s]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) {
      triggerToast("Please select your city of residence.");
      return;
    }
    if (selectedSubjects.length === 0) {
      triggerToast("Please choose at least one subject.");
      return;
    }
    if (!selectedGrade) {
      triggerToast("Please select your class / target level.");
      return;
    }

    if (isTutor) {
      if (!fee || isNaN(Number(fee)) || Number(fee) <= 0) {
        triggerToast("Please enter a valid rate per session.");
        return;
      }
      if (!exp) {
        triggerToast("Please select your experience level.");
        return;
      }

      await updateProfile({
        city,
        subjects: selectedSubjects,
        grade: selectedGrade,
        rate: Number(fee),
        mode,
        exp,
        qual,
        bio,
        online: true,
        avatar: avatar || userProfile?.name?.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "T",
        color: "#000000"
      });
    } else {
      await updateProfile({
        city,
        subjects: selectedSubjects,
        grade: selectedGrade,
        maxFee: Number(maxFee),
        online: true,
        avatar: avatar || userProfile?.name?.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "S",
        color: "#000000"
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-12 px-4 flex justify-center items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl bg-white border-2 border-black rounded-xl p-8 shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] relative"
      >
        <button
          type="button"
          onClick={logOut}
          className="mb-6 flex items-center gap-1.5 text-xs font-bold font-mono text-neutral-600 hover:text-black transition-all bg-white py-1.5 px-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Login</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8 pb-6 border-b-2 border-neutral-100">
          <div className="p-3 bg-black text-white rounded-lg border-2 border-black w-fit">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-black uppercase tracking-tight">Complete Your Profile</h1>
            <p className="text-xs text-neutral-500">Ensure details are accurate for high matching potential</p>
          </div>
          <span className="sm:ml-auto text-[10px] font-bold font-mono tracking-wider text-black bg-neutral-100 border-2 border-black py-1 px-3 rounded-full uppercase">
            {isTutor ? "Tutor Profile Setup" : "Student Setup"}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* PROFILE PICTURE FIELD */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span>👤 Profile Picture</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-black rounded-xl bg-neutral-50">
              <div className="w-16 h-16 rounded-full border-2 border-black bg-black flex items-center justify-center text-white text-xl font-bold uppercase overflow-hidden shrink-0">
                {avatar && (avatar.startsWith("data:image/") || avatar.startsWith("http")) ? (
                  <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  userProfile?.name?.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || (isTutor ? "T" : "S")
                )}
              </div>
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <p className="text-xs font-bold text-black uppercase">Set Your Profile Image</p>
                <p className="text-[10px] text-neutral-500 font-mono">Upload JPG/PNG, auto-compressed for Firestore compatibility</p>
                <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                  <label className="py-1 px-2.5 bg-black hover:bg-neutral-900 border border-black text-white text-[10px] font-bold rounded cursor-pointer uppercase tracking-wider">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement("canvas");
                              const MAX_W = 150;
                              const MAX_H = 150;
                              let w = img.width;
                              let h = img.height;
                              if (w > h) {
                                if (w > MAX_W) { h *= MAX_W / w; w = MAX_W; }
                              } else {
                                if (h > MAX_H) { w *= MAX_H / h; h = MAX_H; }
                              }
                              canvas.width = w;
                              canvas.height = h;
                              const ctx = canvas.getContext("2d");
                              if (ctx) {
                                ctx.drawImage(img, 0, 0, w, h);
                                setAvatar(canvas.toDataURL("image/jpeg", 0.8));
                              }
                            };
                            img.src = ev.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {avatar && (avatar.startsWith("data:image/") || avatar.startsWith("http")) && (
                    <button
                      type="button"
                      onClick={() => setAvatar("")}
                      className="py-1 px-2.5 bg-white hover:bg-neutral-50 border border-black text-black text-[10px] font-bold rounded cursor-pointer uppercase tracking-wider"
                    >
                      Use Fallback Initials
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* CITY AUTOCOMPLETE */}
          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <MapPin size={14} className="text-black" />
              Your City / Region *
            </label>
            <input
              type="text"
              placeholder="e.g. Hyderabad, Kanpur, Delhi..."
              value={cityQuery}
              onChange={(e) => handleCityInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-black focus:bg-neutral-50 rounded-lg text-black text-sm focus:outline-none transition-all"
              required
            />
            {cityMatches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black rounded-lg overflow-hidden z-50 shadow-md">
                {cityMatches.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectCity(c)}
                    className="w-full text-left py-2 px-4 text-black text-sm hover:bg-black hover:text-white transition-all border-b border-neutral-100 last:border-0"
                  >
                    📍 {c}
                  </button>
                ))}
              </div>
            )}
            {city && (
              <p className="text-[11px] text-black font-semibold flex items-center gap-1 font-sans">
                <CheckCircle2 size={12} /> Registered City: <strong>{city}</strong>
              </p>
            )}
          </div>

          {/* SUBJECTS MULTISELECT */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <BookOpen size={14} className="text-black" />
              {isTutor ? "Subjects You Teach *" : "Subjects You Seek Help With *"}
            </label>
            <p className="text-[10px] text-neutral-500 font-sans">Select all matching subjects</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {SUBJECTS.map((s, idx) => {
                const active = selectedSubjects.includes(s);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`py-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all border-2 ${
                      active 
                        ? "border-black bg-black text-white" 
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-black hover:text-black"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRADE SELECT */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers size={14} className="text-black" />
              {isTutor ? "Grades / Levels You Teach *" : "Your Grade / Placement Level *"}
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {GRADES.map((g, idx) => {
                const active = selectedGrade === g;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedGrade(g)}
                    className={`py-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all border-2 ${
                      active 
                        ? "border-black bg-black text-white" 
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-black hover:text-black"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {isTutor ? (
            /* TUTOR SPECIFIC FIELD BLOCK */
            <div className="space-y-4 border-t-2 border-neutral-100 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <IndianRupee size={14} className="text-black" />
                    Session Rate (₹ / Class) *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 400"
                    value={fee}
                    onChange={(e) => setFee(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg text-black text-sm focus:outline-none focus:bg-neutral-50 transition-all font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Briefcase size={14} className="text-black" />
                    Teaching Background *
                  </label>
                  <select
                    value={exp}
                    onChange={(e) => setExp(e.target.value)}
                    className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg text-black text-sm focus:outline-none focus:bg-neutral-50 transition-all appearance-none"
                    required
                  >
                    <option value="">Select experience level...</option>
                    <option value="<1 year">Below 1 Year</option>
                    <option value="1-3 years">1 - 3 Years</option>
                    <option value="4-6 years">4 - 6 Years</option>
                    <option value="7-9 years">7 - 9 Years</option>
                    <option value="10+ years">10+ Years (Senior)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Award size={14} className="text-black" />
                  Educator Session Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MODES.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMode(m as any)}
                      className={`py-2 text-xs font-bold rounded transition-all border-2 ${
                        mode === m 
                          ? "bg-black text-white border-black" 
                          : "bg-white text-black border-neutral-200 hover:border-black"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase tracking-wider font-mono">
                  Qualification / Focus Degrees
                </label>
                <input
                  type="text"
                  placeholder="e.g. BTech IIT Kanpur, MA English Literature"
                  value={qual}
                  onChange={(e) => setQual(e.target.value)}
                  className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg text-black text-sm focus:outline-none focus:bg-neutral-50 transition-all font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase tracking-wider font-mono">
                  Your Biography / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Introduce yourself to the students..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg text-black text-sm focus:outline-none focus:bg-neutral-50 transition-all resize-none font-sans"
                />
              </div>
            </div>
          ) : (
            /* STUDENT SPECIFIC FIELD BLOCK */
            <div className="space-y-4 border-t-2 border-neutral-100 pt-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <IndianRupee size={14} className="text-black" />
                  Max Hourly/Session Budget (₹)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={Number(maxFee) || 100}
                    onChange={(e) => setMaxFee(e.target.value)}
                    className="flex-1 accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg appearance-none"
                  />
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs text-neutral-500 font-bold font-mono">₹</span>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      value={maxFee}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setMaxFee(val);
                      }}
                      placeholder="e.g. 500"
                      className="w-28 text-center pl-7 pr-3 py-2 bg-white border-2 border-black rounded-lg font-bold text-xs font-mono focus:outline-none focus:bg-neutral-50"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 font-sans italic">
                  Drag the slider or write your budget directly in the text box above!
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-black hover:bg-neutral-900 border-2 border-black text-white font-bold font-display uppercase tracking-widest text-xs rounded-lg shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            Publish Profile Live
          </button>
        </form>
      </motion.div>
    </div>
  );
};
