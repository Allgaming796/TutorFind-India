import React, { useState, useEffect, useRef } from "react";
import { useFirebase } from "../FirebaseContext";
import { ArrowLeft, Send, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface ChatWindowProps {
  onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBack }) => {
  const { 
    currentUser, 
    userProfile, 
    chats, 
    messages, 
    activeChatId, 
    sendMessage 
  } = useFirebase();

  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  // Auto Scroll on message update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage(text.trim());
    setText("");
  };

  if (!activeChat || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <ShieldAlert size={36} className="text-red-500 mb-2" />
        <h3 className="font-bold text-white font-display">Conversation room not found</h3>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white">
          Return Home
        </button>
      </div>
    );
  }

  const isTutor = userProfile?.role === "tutor";
  const peerName = isTutor ? activeChat.studentName : activeChat.tutorName;
  const peerAvatar = isTutor ? activeChat.studentAvatar : activeChat.tutorAvatar;
  const peerColor = isTutor ? activeChat.studentColor : activeChat.tutorColor;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* CHAT HEADER */}
      <header className="sticky top-0 bg-slate-900 border-b border-slate-800 z-40 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-1 px-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>

        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white uppercase shadow"
          style={{ backgroundColor: peerColor || "#4f46e5" }}
        >
          {peerAvatar || "P"}
        </div>

        <div>
          <h2 className="text-sm font-bold text-white font-display leading-tight">{peerName}</h2>
          <span className="text-[9px] text-slate-500 leading-none">Real-Time persistent Dialogue</span>
        </div>
      </header>

      {/* MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col justify-end min-h-0 bg-slate-950/60 no-scrollbar">
        {messages.length === 0 ? (
          <div className="my-auto py-12 text-center text-slate-600 text-xs italic space-y-1 font-sans">
            <p>No message logs yet.</p>
            <p className="text-[10px]">Type a greeting to start real-time sync with {peerName}!</p>
          </div>
        ) : (
          <div className="space-y-3.5 overflow-y-auto no-scrollbar">
            {messages.map((m) => {
              const mine = m.senderId === currentUser.uid;
              return (
                <div 
                  key={m.id} 
                  className={`flex ${mine ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {!mine && (
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase"
                      style={{ backgroundColor: peerColor || "#4f46e5" }}
                    >
                      {peerAvatar || "P"}
                    </div>
                  )}

                  <div className="max-w-[70%] space-y-1">
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed font-sans shadow-md border ${
                      mine 
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white rounded-br-none border-indigo-500" 
                        : "bg-slate-900 text-slate-200 rounded-bl-none border-slate-850"
                    }`}>
                      {m.text}
                    </div>
                    <span className={`block text-[8px] font-mono text-slate-500 ${mine ? "text-right" : "text-left"}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* CHAT INPUT FORM */}
      <form onSubmit={handleSend} className="bg-slate-900 border-t border-slate-800 p-3 flex gap-2 items-center">
        <input
          type="text"
          placeholder={`Leave a message for ${peerName}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-full text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans"
        />
        <button
          type="submit"
          className="p-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
