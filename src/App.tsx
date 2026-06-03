import React, { useState } from "react";
import { useFirebase } from "./FirebaseContext";
import { HashRouter } from "react-router-dom";
import { AuthScreen } from "./components/AuthScreen";
import { ProfileSetup } from "./components/ProfileSetup";
import { StudentDashboard } from "./components/StudentDashboard";
import { TutorDashboard } from "./components/TutorDashboard";
import { TutorProfileDetail } from "./components/TutorProfileDetail";
import { BookingWizard } from "./components/BookingWizard";
import { ChatWindow } from "./components/ChatWindow";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function App() {
  const { 
    currentUser, 
    userProfile, 
    loading, 
    activeChatId, 
    setActiveChatId,
    toast 
  } = useFirebase();

  // Student specific subscreen states
  const [selectedTutorIndex, setSelectedTutorIndex] = useState<number | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Clean Loader Spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans space-y-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-505/25 border-t-indigo-500 rounded-full"
        />
        <p className="text-slate-400 text-xs tracking-widest uppercase font-mono font-bold">
          Configuring Secure Handshake...
        </p>
      </div>
    );
  }

  // 1. Authenticate Filter
  if (!currentUser) {
    return <AuthScreen />;
  }

  // 2. Profile setup check — if profile data has no city, complete the setup form.
  if (!userProfile?.city) {
    return <ProfileSetup />;
  }

  const isTutor = userProfile.role === "tutor";

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100">
        <AnimatePresence mode="wait">
        {/* If Active Chat Room overlay triggers */}
        {activeChatId ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 bg-slate-950 z-50 flex flex-col"
          >
            <ChatWindow onBack={() => {
              setActiveChatId(null);
            }} />
          </motion.div>
        ) : !isTutor ? (
          /* STUDENT VIEWS BRANCH */
          isBooking && selectedTutorIndex !== null ? (
            <motion.div
              key="booking"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
            >
              <BookingWizard
                tutorIndex={selectedTutorIndex}
                onBack={() => setIsBooking(false)}
                onSuccess={() => {
                  setIsBooking(false);
                  setSelectedTutorIndex(null);
                }}
              />
            </motion.div>
          ) : selectedTutorIndex !== null ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <TutorProfileDetail
                tutorIndex={selectedTutorIndex}
                onBack={() => setSelectedTutorIndex(null)}
                onBook={() => setIsBooking(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="student-dash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StudentDashboard 
                onSelectTutor={(idx) => setSelectedTutorIndex(idx)}
                onBookTutor={(idx) => {
                  setSelectedTutorIndex(idx);
                  setIsBooking(true);
                }}
              />
            </motion.div>
          )
        ) : (
          /* TUTOR VIEWS BRANCH */
          <motion.div
            key="tutor-dash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TutorDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL TOAST ALERTS */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 35, x: "-50%" }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-slate-100 py-3.5 px-6 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 max-w-sm w-[90%] font-sans text-xs"
          >
            <CheckCircle2 size={15} className="text-indigo-400 flex-shrink-0" />
            <span className="font-semibold leading-relaxed">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </HashRouter>
  );
}
