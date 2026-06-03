import React, { useState } from "react";
import { useFirebase } from "../FirebaseContext";
import { Mail, Lock, User, Eye, EyeOff, Sparkles, GraduationCap, Users } from "lucide-react";
import { motion } from "motion/react";

export const AuthScreen: React.FC = () => {
  const { signUp, logIn, loading, triggerToast } = useFirebase();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"student" | "tutor">("student");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass) {
      triggerToast("Please fill in email and password.");
      return;
    }
    if (authMode === "signup" && !name) {
      triggerToast("Please enter your full name.");
      return;
    }

    try {
      if (authMode === "signup") {
        await signUp(email, pass, name, role);
      } else {
        await logIn(email, pass);
      }
    } catch (err: any) {
      // toast shown inside firebaseContext
    }
  };

  const tryDemo = async (selectedRole: "student" | "tutor") => {
    const demoEmail = selectedRole === "student" ? "demo_student@tutorfind.in" : "demo_tutor@tutorfind.in";
    const demoPass = "demopass123";
    try {
      await logIn(demoEmail, demoPass);
    } catch (err) {
      // If demo account doesn't exist yet, sign up automatically
      try {
        await signUp(demoEmail, demoPass, selectedRole === "student" ? "Demo Student" : "Demo Tutor", selectedRole);
      } catch (signupErr) {
        triggerToast("Demo mode initialized in sandboxed state.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-slate-950 to-slate-850 rounded-2xl flex items-center justify-center shadow-lg border border-slate-700/50 text-slate-100 font-display font-medium text-3xl mb-4">
            📚
          </div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">TutorFind India</h1>
          <p className="text-slate-400 text-xs mt-1 text-center font-sans">
            Connect with certified, local and online tutors in India instantly
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === "login" 
                ? "bg-slate-800 text-white shadow-md shadow-black/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("signup")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === "signup" 
                ? "bg-slate-800 text-white shadow-md shadow-black/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === "signup" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Priyanjali Sen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 p-0.5 text-slate-500 hover:text-slate-300 transition-all"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {authMode === "signup" && (
            <div className="py-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`py-3 px-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    role === "student"
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  <GraduationCap className="mb-1" size={20} />
                  <span className="text-xs font-bold leading-tight font-display">Student</span>
                  <span className="text-[9px] opacity-70 font-mono mt-0.5">Need a tutor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("tutor")}
                  className={`py-3 px-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    role === "tutor"
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  <Users className="mb-1" size={20} />
                  <span className="text-xs font-bold leading-tight font-display">Tutor</span>
                  <span className="text-[9px] opacity-70 font-mono mt-0.5">Teach &amp; Earn</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{authMode === "login" ? "Sign In" : "Register Account"}</span>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-700" />
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold font-mono">OR EXPLORE</span>
          <div className="flex-grow border-t border-slate-700" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => tryDemo("student")}
            className="py-2.5 px-3 bg-slate-950 hover:bg-slate-900 text-indigo-400 border border-indigo-500/25 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Sparkles size={13} />
            Student Demo
          </button>
          <button
            type="button"
            onClick={() => tryDemo("tutor")}
            className="py-2.5 px-3 bg-slate-950 hover:bg-slate-900 text-emerald-400 border border-emerald-500/25 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Sparkles size={13} />
            Tutor Demo
          </button>
        </div>
      </motion.div>
    </div>
  );
};
