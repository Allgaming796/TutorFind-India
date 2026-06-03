import React from "react";
import { useFirebase } from "../FirebaseContext";
import { INITIAL_TUTORS_DATA } from "../constants";
import { ArrowLeft, MessageSquare, Calendar, Star, MapPin, Award, BookOpen, Layers } from "lucide-react";
import { motion } from "motion/react";

interface TutorProfileDetailProps {
  tutorIndex: number;
  onBack: () => void;
  onBook: () => void;
}

export const TutorProfileDetail: React.FC<TutorProfileDetailProps> = ({ tutorIndex, onBack, onBook }) => {
  const { tutors, setActiveChatId } = useFirebase();

  // Find dynamic tutor profile from firestore or constants
  const tutorData = tutors[tutorIndex - 1];
  const refStatic = INITIAL_TUTORS_DATA[tutorIndex - 1] || INITIAL_TUTORS_DATA[0];

  if (!tutorData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <h3 className="font-bold text-white font-display">Tutor Profile Not Found</h3>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white">
          Return Home
        </button>
      </div>
    );
  }

  // Combine Firestore rates with static historical reviews for high fidelity look
  const reviews = refStatic.refReviews || [];

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
        <span className="font-bold text-white font-display text-sm">Review Credentials</span>
      </header>

      {/* BODY PANEL */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-6 pb-24">
        
        {/* HERO SECTION */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-5 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white uppercase shadow-lg flex-shrink-0 border-2 border-slate-800 relative"
            style={{ backgroundColor: tutorData.color || "#4f46e5" }}
          >
            {tutorData.avatar || tutorData.name.slice(0, 2)}
            {tutorData.online && (
              <span className="absolute bottom-1 right-1 w-4.5 h-4.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-1.5 min-w-0">
            <h1 className="text-xl font-bold text-white font-display tracking-tight flex flex-col md:flex-row md:items-center gap-2">
              {tutorData.name}
              {tutorData.qual && (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono mx-auto md:mx-0 w-max font-bold">
                  {tutorData.qual}
                </span>
              )}
            </h1>

            <p className="text-xs text-slate-400 font-sans flex items-center justify-center md:justify-start gap-1">
              <MapPin size={12} className="text-indigo-400" />
              Resident of <strong>{tutorData.city}</strong> &nbsp;·&nbsp; {tutorData.exp} experience
            </p>

            <div className="flex items-center justify-center md:justify-start gap-1.5 text-sm font-bold pt-1 text-amber-400">
              <Star size={14} fill="currentColor" />
              <span>{tutorData.rating || "5.0"} rating</span>
              <span className="text-slate-500 font-normal font-sans text-xs">({tutorData.reviewsCount || 0} classes structured)</span>
            </div>
          </div>

          <div className="bg-slate-950 px-4 py-3 rounded-2xl border border-slate-850 text-center w-full md:w-auto flex-shrink-0 font-display">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase font-mono block">SESSION CHARGE</span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">₹{tutorData.rate}/class</div>
          </div>
        </div>

        {/* DETAILS BIOGRAPHY */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Award size={14} className="text-indigo-400" />
            <h3 className="text-xs font-bold tracking-wider font-mono uppercase">Biography Statement</h3>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {tutorData.bio || "Certified educator listed transparently with TutorFind credentials."}
          </p>
        </div>

        {/* TARGET CLASSIFICATIONS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <BookOpen size={14} className="text-indigo-400" />
            <h3 className="text-xs font-bold tracking-wider font-mono uppercase">Subjects &amp; Grade Reach</h3>
          </div>

          <div className="space-y-3">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 tracking-wider uppercase font-mono mb-2">TARGET CLASSES</span>
              <span className="text-xs font-bold bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-850 text-slate-300">
                {tutorData.grade || "All Grades"}
              </span>
            </div>

            <div>
              <span className="block text-[9px] font-bold text-slate-500 tracking-wider uppercase font-mono mb-2">EDUCATIONAL TOPICS</span>
              <div className="flex flex-wrap gap-1.5">
                {(tutorData.subjects || []).map((sub, i) => (
                  <span key={i} className="text-xs bg-slate-950 text-slate-400 py-1 px-3 rounded-full font-mono border border-slate-850">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <span className="block text-[9px] font-bold text-slate-500 tracking-wider uppercase font-mono mb-2">TEACHING MODE</span>
              <span className="text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 py-1 px-3.5 rounded-full uppercase tracking-wider font-mono">
                🌐 {tutorData.mode} Class Available
              </span>
            </div>
          </div>
        </div>

        {/* FEEDBACK LIST */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Star size={14} className="text-indigo-400" />
            <h3 className="text-xs font-bold tracking-wider font-mono uppercase">Student Endorsements ({reviews.length})</h3>
          </div>

          <div className="space-y-3 divide-y divide-slate-800/60">
            {reviews.length === 0 ? (
              <p className="text-xs italic text-slate-500">No review statements compiled yet.</p>
            ) : (
              reviews.map((rev, i) => (
                <div key={i} className={`pt-3 first:pt-0 space-y-1.5 font-sans`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white leading-none">{rev.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{rev.date}</span>
                  </div>
                  <div className="flex text-amber-400 gap-0.5 text-[10px]">
                    {Array.from({ length: rev.rating }).map((_, rIdx) => (
                      <Star key={rIdx} size={10} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed italic">
                    "{rev.text}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* NAV FOOTER CTAS */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 bg-slate-900 border-t border-slate-800 px-4 z-40">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={async () => {
              const rId = await useFirebase().createChatRoom(tutorData.uid);
              setActiveChatId(rId);
              // Trigger return to student dashboard chats tab trigger
              onBack();
            }}
            className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold border border-slate-800 rounded-2xl cursor-pointer text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <MessageSquare size={14} />
            Chat Instant
          </button>
          <button
            onClick={onBook}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl cursor-pointer text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/15"
          >
            <Calendar size={14} />
            Reservations Slot
          </button>
        </div>
      </footer>
    </div>
  );
};
