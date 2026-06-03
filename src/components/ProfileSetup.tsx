import React, { useState } from "react";
import { useFirebase } from "../FirebaseContext";
import { SUBJECTS, GRADES, MODES, CITIES } from "../constants";
import { MapPin, BookOpen, Layers, IndianRupee, Briefcase, Award, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

export const ProfileSetup: React.FC = () => {
  const { userProfile, updateProfile, triggerToast } = useFirebase();
  const isTutor = userProfile?.role === "tutor";

  // Shared state
  const [city, setCity] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [cityMatches, setCityMatches] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("");

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
        avatar: userProfile?.name?.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "T",
        color: userProfile?.color || "#4f46e5"
      });
    } else {
      await updateProfile({
        city,
        subjects: selectedSubjects,
        grade: selectedGrade,
        maxFee: Number(maxFee),
        online: true,
        avatar: userProfile?.name?.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "S",
        color: userProfile?.color || "#10b981"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 flex justify-center items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-white">Complete Your Profile</h1>
            <p className="text-xs text-slate-400">Takes less than 1 minute to list you correctly</p>
          </div>
          <span className="ml-auto text-[10px] font-bold font-mono tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 py-1 px-2.5 rounded-full uppercase">
            {isTutor ? "Tutor Setup" : "Student Setup"}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* CITY AUTOCOMPLETE */}
          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <MapPin size={14} className="text-slate-500" />
              Your City / Region *
            </label>
            <input
              type="text"
              placeholder="e.g. Hyderabad, Kanpur, Delhi..."
              value={cityQuery}
              onChange={(e) => handleCityInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-200 text-sm focus:outline-none transition-all"
              required
            />
            {cityMatches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden z-50 shadow-2xl">
                {cityMatches.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectCity(c)}
                    className="w-full text-left py-2.5 px-4 text-slate-300 text-xs hover:bg-indigo-600 hover:text-white transition-all border-b border-slate-900 last:border-0"
                  >
                    📍 {c}
                  </button>
                ))}
              </div>
            )}
            {city && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-sans">
                <CheckCircle2 size={12} /> Registered in: <strong>{city}</strong>
              </p>
            )}
          </div>

          {/* SUBJECTS MULTISELECT */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <BookOpen size={14} className="text-slate-500" />
              {isTutor ? "Subjects You Teach *" : "Subjects You Need Help With *"}
            </label>
            <p className="text-[10px] text-slate-500 font-sans">Choose all that apply</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {SUBJECTS.map((s, idx) => {
                const active = selectedSubjects.includes(s);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`py-1.5 px-3.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                      active 
                        ? "border-indigo-500 bg-indigo-500/15 text-indigo-300 font-bold" 
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-705"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRADE SELECT */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <Layers size={14} className="text-slate-500" />
              {isTutor ? "Grades / Levels You Teach *" : "Your Academic Level *"}
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {GRADES.map((g, idx) => {
                const active = selectedGrade === g;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedGrade(g)}
                    className={`py-1.5 px-3.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                      active 
                        ? "border-indigo-500 bg-indigo-500/15 text-indigo-300 font-bold" 
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-705"
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
            <div className="space-y-4 border-t border-slate-800/60 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                    <IndianRupee size={14} className="text-slate-500" />
                    Session Fee (₹) *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 400"
                    value={fee}
                    onChange={(e) => setFee(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-200 text-sm focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                    <Briefcase size={14} className="text-slate-500" />
                    Teaching Experience *
                  </label>
                  <select
                    value={exp}
                    onChange={(e) => setExp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-300 text-sm focus:outline-none transition-all"
                    required
                  >
                    <option value="">Choose experience...</option>
                    <option value="<1 year">less than 1 Year</option>
                    <option value="1-3 years">1 - 3 Years</option>
                    <option value="4-6 years">4 - 6 Years</option>
                    <option value="7-9 years">7 - 9 Years</option>
                    <option value="10+ years">10+ Years Expert</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                  <Award size={14} className="text-slate-500" />
                  Educator Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MODES.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMode(m as any)}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                        mode === m 
                          ? "bg-slate-100 text-slate-950 font-bold" 
                          : "bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                  Qualification / Degrees
                </label>
                <input
                  type="text"
                  placeholder="e.g. BTech IIT Kanpur, MA English Lit"
                  value={qual}
                  onChange={(e) => setQual(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-200 text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                  About You / Quick Intro Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell students about your style of explaining concepts..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-200 text-sm focus:outline-none transition-all resize-none font-sans"
                />
              </div>
            </div>
          ) : (
            /* STUDENT SPECIFIC FIELD BLOCK */
            <div className="space-y-4 border-t border-slate-800/60 pt-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                  <IndianRupee size={14} className="text-slate-500" />
                  Your Maximum Fee Budget (₹ per Class)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={maxFee}
                    onChange={(e) => setMaxFee(e.target.value)}
                    className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                  />
                  <div className="w-24 text-center py-2 bg-slate-950 rounded-xl font-bold border border-slate-800 text-white">
                    ₹{maxFee}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all"
          >
            Publish Profile Live ✨
          </button>
        </form>
      </motion.div>
    </div>
  );
};
