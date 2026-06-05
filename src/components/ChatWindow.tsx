import React, { useState, useEffect, useRef } from "react";
import { useFirebase } from "../FirebaseContext";
import { ArrowLeft, Send, ShieldAlert } from "lucide-react";

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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <ShieldAlert size={36} className="text-black mb-2" />
        <h3 className="font-bold text-black font-display uppercase tracking-widest">Conversation not found</h3>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-black text-white rounded border-2 border-black text-xs font-bold uppercase tracking-wider font-display">
          Return Home
        </button>
      </div>
    );
  }

  const isTutor = userProfile?.role === "tutor";
  const peerName = isTutor ? activeChat.studentName : activeChat.tutorName;
  const peerAvatar = isTutor ? activeChat.studentAvatar : activeChat.tutorAvatar;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black">
      {/* CHAT HEADER */}
      <header className="sticky top-0 bg-white border-b-2 border-black z-40 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-1 px-2 border-2 border-black rounded hover:bg-neutral-100 text-black transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>

        <div 
          className="w-10 h-10 rounded-full border-2 border-black bg-black text-white flex items-center justify-center font-bold uppercase shadow-sm"
        >
          {peerAvatar || "P"}
        </div>

        <div>
          <h2 className="text-sm font-bold text-black font-display uppercase tracking-wider leading-tight">{peerName}</h2>
          <span className="text-[9px] text-neutral-500 font-mono font-bold leading-none">Persistent Dialogue Sync</span>
        </div>
      </header>

      {/* MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-end min-h-0 bg-white no-scrollbar">
        {messages.length === 0 ? (
          <div className="my-auto py-12 text-center text-neutral-400 text-xs italic space-y-1 font-sans">
            <p>No messages logs.</p>
            <p className="text-[10px] font-mono not-italic font-bold text-black uppercase">Start a dialog with {peerName}!</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto no-scrollbar">
            {messages.map((m) => {
              const mine = m.senderId === currentUser.uid;
              return (
                <div 
                  key={m.id} 
                  className={`flex ${mine ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {!mine && (
                    <div 
                      className="w-7 h-7 rounded-full border border-black bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-black uppercase"
                    >
                      {peerAvatar || "P"}
                    </div>
                  )}

                  <div className="max-w-[70%] space-y-1">
                    <div className={`p-3 rounded-lg text-xs leading-relaxed font-sans shadow-sm border-2 ${
                      mine 
                        ? "bg-black text-white rounded-br-none border-black" 
                        : "bg-white text-black rounded-bl-none border-black border-dashed"
                    }`}>
                      {m.text}
                    </div>
                    <span className={`block text-[8px] font-mono font-bold text-neutral-500 ${mine ? "text-right" : "text-left"}`}>
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
      <form onSubmit={handleSend} className="bg-white border-t-2 border-black p-3 flex gap-2 items-center">
        <input
          type="text"
          placeholder={`Inquire to ${peerName}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-white border-2 border-black rounded-lg text-black font-semibold text-xs focus:outline-none focus:bg-neutral-50 font-sans"
        />
        <button
          type="submit"
          className="p-3 bg-black hover:bg-neutral-900 border-2 border-black text-white rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
