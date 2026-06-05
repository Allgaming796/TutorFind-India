import React from "react";
import { useFirebase, safeStorage } from "../FirebaseContext";
import { INITIAL_TUTORS_DATA } from "../constants";
import { ArrowLeft, MessageSquare, Calendar, Star, MapPin, Award, BookOpen, Heart } from "lucide-react";
import { motion } from "motion/react";

interface TutorProfileDetailProps {
  tutorIndex: number;
  onBack: () => void;
  onBook: () => void;
}

export const TutorProfileDetail: React.FC<TutorProfileDetailProps> = ({ tutorIndex, onBack, onBook }) => {
  const { tutors, setActiveChatId, userProfile, triggerToast, createChatRoom } = useFirebase();

  // Find dynamic tutor profile from firestore or constants
  const tutorData = tutors[tutorIndex - 1];
  const refStatic = INITIAL_TUTORS_DATA[tutorIndex - 1] || INITIAL_TUTORS_DATA[0];

  const [isFavorite, setIsFavorite] = React.useState<boolean>(() => {
    if (!userProfile?.uid || !tutorData?.uid) return false;
    const favoritesKey = `tutorfind_favorites_${userProfile.uid}`;
    const favorites = safeStorage.parseItem<string[]>(favoritesKey, []);
    return favorites.includes(tutorData.uid);
  });

  const toggleFavorite = () => {
    if (!userProfile?.uid || !tutorData?.uid) return;
    const favoritesKey = `tutorfind_favorites_${userProfile.uid}`;
    const favorites = safeStorage.parseItem<string[]>(favoritesKey, []);
    let newFavorites;
    if (favorites.includes(tutorData.uid)) {
      newFavorites = favorites.filter((id: string) => id !== tutorData.uid);
      setIsFavorite(false);
      triggerToast("Removed from bookmarked favorites.");
    } else {
      newFavorites = [...favorites, tutorData.uid];
      setIsFavorite(true);
      triggerToast("Added to bookmarked favorites! ❤️");
    }
    safeStorage.setItem(favoritesKey, JSON.stringify(newFavorites));
  };

  if (!tutorData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h3 className="font-bold text-black font-display uppercase tracking-widest">Tutor Profile Not Found</h3>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-black text-white rounded-lg border-2 border-black text-xs font-bold font-display uppercase tracking-wider">
          Return Home
        </button>
      </div>
    );
  }

  // Combine Firestore rates with static historical reviews for high fidelity look
  const reviews = refStatic.refReviews || [];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      {/* HEADER BAR */}
      <header className="sticky top-0 bg-white border-b-2 border-black z-40 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1 px-2 border-2 border-black rounded hover:bg-neutral-100 text-black transition-all cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-black font-display text-sm uppercase tracking-wider">Review Credentials</span>
        </div>
        
        {userProfile?.role === "student" && (
          <button
            onClick={toggleFavorite}
            className={`px-3 py-1.5 border-2 border-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold font-mono uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              isFavorite ? "bg-red-500 text-white hover:bg-red-600" : "bg-white text-black hover:bg-neutral-50"
            }`}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-white animate-pulse" : "text-black"} />
            <span>{isFavorite ? "Favorited" : "Favorite"}</span>
          </button>
        )}
      </header>

      {/* BODY PANEL */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-6 pb-28">
        
        {/* HERO SECTION */}
        <div className="bg-white border-2 border-black rounded-lg p-6 flex flex-col md:flex-row items-center md:items-start gap-5 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] relative overflow-hidden">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-black uppercase shadow flex-shrink-0 border-2 border-black relative overflow-hidden"
          >
            {tutorData.avatar && (tutorData.avatar.startsWith("data:image/") || tutorData.avatar.startsWith("http")) ? (
              <img src={tutorData.avatar} alt={tutorData.name} className="w-full h-full object-cover" />
            ) : (
              tutorData.avatar || tutorData.name.slice(0, 2)
            )}
            {tutorData.online && (
              <span className="absolute bottom-1 right-1 w-4.5 h-4.5 bg-neutral-900 border-2 border-white rounded-full z-10" />
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
            <h1 className="text-xl font-bold text-black font-display tracking-tight flex flex-col md:flex-row md:items-center gap-2 uppercase">
              {tutorData.name}
              {tutorData.qual && (
                <span className="text-[10px] bg-neutral-100 text-black border-2 border-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono mx-auto md:mx-0 w-max font-bold">
                  {tutorData.qual}
                </span>
              )}
            </h1>

            <p className="text-xs text-neutral-600 font-semibold flex items-center justify-center md:justify-start gap-1 font-mono">
              <MapPin size={12} className="text-black" />
              Resident of <strong>{tutorData.city}</strong> &nbsp;·&nbsp; {tutorData.exp} Exp
            </p>

            <div className="flex items-center justify-center md:justify-start gap-1.5 text-sm font-bold pt-1 text-black">
              <Star size={14} fill="currentColor" className="text-black" />
              <span>{tutorData.rating || "5.0"} rating</span>
              <span className="text-neutral-500 font-normal font-sans text-xs">({tutorData.reviewsCount || 0} classes structured)</span>
            </div>
          </div>

          <div className="bg-neutral-50 px-4 py-3 rounded-lg border-2 border-black text-center w-full md:w-auto flex-shrink-0 font-display">
            <span className="text-[9px] font-extrabold text-neutral-500 tracking-wider uppercase font-mono block">SESSION CHARGE</span>
            <div className="text-2xl font-bold text-black mt-1 font-mono">₹{tutorData.rate}/class</div>
          </div>
        </div>

        {/* DETAILS BIOGRAPHY */}
        <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] space-y-3">
          <div className="flex items-center gap-1.5 text-black">
            <Award size={14} className="text-black" />
            <h3 className="text-xs font-bold tracking-wider font-mono uppercase">Biography Statement</h3>
          </div>
          <p className="text-xs text-neutral-700 font-sans leading-relaxed">
            {tutorData.bio || "Certified educator listed transparently with TutorFind credentials."}
          </p>
        </div>

        {/* TARGET CLASSIFICATIONS */}
        <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] space-y-4">
          <div className="flex items-center gap-1.5 text-black">
            <BookOpen size={14} className="text-black" />
            <h3 className="text-xs font-bold tracking-wider font-mono uppercase">Subjects &amp; Grade Reach</h3>
          </div>

          <div className="space-y-4 font-sans text-xs">
            <div>
              <span className="block text-[9px] font-bold text-neutral-500 tracking-wider uppercase font-mono mb-2">TARGET CLASSES</span>
              <span className="text-xs font-bold bg-neutral-100 py-1.5 px-3 rounded-md border-2 border-black text-black">
                {tutorData.grade || "All Grades"}
              </span>
            </div>

            <div>
              <span className="block text-[9px] font-bold text-neutral-500 tracking-wider uppercase font-mono mb-2">EDUCATIONAL TOPICS</span>
              <div className="flex flex-wrap gap-1.5">
                {(tutorData.subjects || []).map((sub, i) => (
                  <span key={i} className="text-xs bg-neutral-100 text-black py-1 px-3 rounded font-mono border-2 border-neutral-300">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <span className="block text-[9px] font-bold text-neutral-500 tracking-wider uppercase font-mono mb-2">TEACHING MODE</span>
              <span className="text-xs font-bold bg-black text-white border-2 border-black py-1 px-3.5 rounded font-mono uppercase">
                🌐 {tutorData.mode} Class Available
              </span>
            </div>
          </div>
        </div>

        {/* FEEDBACK LIST */}
        <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] space-y-4">
          <div className="flex items-center gap-1.5 text-black">
            <Star size={14} className="text-black" />
            <h3 className="text-xs font-bold tracking-wider font-mono uppercase">Student Endorsements ({reviews.length})</h3>
          </div>

          <div className="space-y-4 divide-y-2 divide-neutral-100">
            {reviews.length === 0 ? (
              <p className="text-xs italic text-neutral-500 font-sans">No review statements compiled yet.</p>
            ) : (
              reviews.map((rev, i) => (
                <div key={i} className={`pt-4 first:pt-0 space-y-1.5 font-sans`}>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="font-bold text-black leading-none">{rev.name}</span>
                    <span className="text-[10px] font-mono text-neutral-500 font-bold">{rev.date}</span>
                  </div>
                  <div className="flex text-black gap-0.5 text-[10px]">
                    {Array.from({ length: rev.rating }).map((_, rIdx) => (
                      <Star key={rIdx} size={10} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-neutral-600 text-xs leading-relaxed italic">
                    "{rev.text}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* NAV FOOTER CTAS */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 bg-white border-t-2 border-black px-4 z-40">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={async () => {
              const rId = await createChatRoom(tutorData.uid);
              setActiveChatId(rId);
              // Trigger return to student dashboard chats tab trigger
              onBack();
            }}
            className="flex-1 py-3 bg-white hover:bg-neutral-50 text-black font-bold border-2 border-black rounded-lg cursor-pointer text-xs flex items-center justify-center gap-2 active:translate-y-[1px] transition-all uppercase tracking-wide font-display"
          >
            <MessageSquare size={14} />
            Chat Instant
          </button>
          <button
            onClick={onBook}
            className="flex-1 py-3 bg-black hover:bg-neutral-900 border-2 border-black text-white font-bold rounded-lg cursor-pointer text-xs flex items-center justify-center gap-2 active:translate-y-[1px] transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] uppercase tracking-wide font-display"
          >
            <Calendar size={14} />
            Reserve Slot
          </button>
        </div>
      </footer>
    </div>
  );
};
