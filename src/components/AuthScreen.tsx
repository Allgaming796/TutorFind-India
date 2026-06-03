import React, { useState } from "react";
import { useFirebase } from "../FirebaseContext";
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, Users, Sparkles } from "lucide-react";
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
        await signUp(demoEmail, demoPass, selectedRole === "student" ? "Demo Student" : "ASHVIKA", selectedRole);
      } catch (signupErr) {
        triggerToast("Demo mode initialized in sandboxed state.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-xl border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-black border-2 border-black rounded-lg flex items-center justify-center shadow-md text-white font-display font-bold text-3xl mb-4">
            📚
          </div>
          <h1 className="text-3xl font-bold font-display text-black tracking-tight uppercase">TutorFind</h1>
          <p className="text-neutral-600 text-xs mt-1 text-center font-sans tracking-wide">
            Connect with certified, local and online tutors inside India instantly.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-neutral-100 p-1 border-2 border-black rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`flex-1 py-2 text-xs font-bold font-display uppercase tracking-wider rounded transition-all ${
              authMode === "login" 
                ? "bg-black text-white shadow-sm" 
                : "text-neutral-500 hover:text-black"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("signup")}
            className={`flex-1 py-2 text-xs font-bold font-display uppercase tracking-wider rounded transition-all ${
              authMode === "signup" 
                ? "bg-black text-white shadow-sm" 
                : "text-neutral-500 hover:text-black"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === "signup" && (
            <div>
              <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-1.5 font-mono">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="e.g. Ashwika Chaudhary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border-2 border-black rounded-lg text-black text-sm focus:outline-none focus:bg-neutral-50 transition-all font-sans"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-1.5 font-mono">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-neutral-500" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border-2 border-black rounded-lg text-black text-sm focus:outline-none focus:bg-neutral-50 transition-all font-sans"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-1.5 font-mono">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-neutral-500" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white border-2 border-black rounded-lg text-black text-sm focus:outline-none focus:bg-neutral-50 transition-all font-sans"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2.5 p-0.5 text-neutral-500 hover:text-black transition-all"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {authMode === "signup" && (
            <div className="py-2">
              <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-2 font-mono">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`py-3 px-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center ${
                    role === "student"
                      ? "border-black bg-neutral-100 text-black font-extrabold"
                      : "border-neutral-200 bg-white text-neutral-500 hover:border-black hover:text-black"
                  }`}
                >
                  <GraduationCap className="mb-1" size={20} />
                  <span className="text-xs font-bold font-display uppercase tracking-wider">Student</span>
                  <span className="text-[9px] opacity-70 font-mono mt-0.5">Need a tutor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("tutor")}
                  className={`py-3 px-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center ${
                    role === "tutor"
                      ? "border-black bg-neutral-100 text-black font-extrabold"
                      : "border-neutral-200 bg-white text-neutral-500 hover:border-black hover:text-black"
                  }`}
                >
                  <Users className="mb-1" size={20} />
                  <span className="text-xs font-bold font-display uppercase tracking-wider">Tutor</span>
                  <span className="text-[9px] opacity-70 font-mono mt-0.5">Teach &amp; Earn</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black hover:bg-neutral-900 text-white font-bold font-display uppercase tracking-widest text-xs rounded-lg transition-all border-2 border-black flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{authMode === "login" ? "Sign In" : "Register Account"}</span>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t-2 border-neutral-200" />
          <span className="flex-shrink mx-4 text-neutral-400 text-[10px] font-bold font-mono tracking-wider">OR QUICK TEST DEMO</span>
          <div className="flex-grow border-t-2 border-neutral-200" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => tryDemo("student")}
            className="py-2.5 px-3 bg-white hover:bg-neutral-100 text-black border-2 border-black rounded-lg font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-y-[1px]"
          >
            <Sparkles size={13} />
            Student Login
          </button>
          <button
            type="button"
            onClick={() => tryDemo("tutor")}
            className="py-2.5 px-3 bg-white hover:bg-neutral-100 text-black border-2 border-black rounded-lg font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-y-[1px]"
          >
            <Sparkles size={13} />
            Tutor Login
          </button>
        </div>
      </motion.div>
    </div>
  );
};
