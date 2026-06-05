import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { auth, db, dbSetDoc, dbGetDoc, dbGetDocs, dbOnSnapshot } from "./firebase";
import { doc, query, collection, where, orderBy, limit } from "firebase/firestore";
import { UserProfile, Booking, Chat, Message } from "./types";
import { INITIAL_TUTORS_DATA } from "./constants";

// Safe LocalStorage helpers supporting sandbox & iframe security constraints
export const safeStorage = {
  getItem: (key: string, fallback: string = ""): string => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key) || fallback;
      }
    } catch (e) {
      console.warn("Storage security exception or block:", e);
    }
    return fallback;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("Storage security exception or block:", e);
    }
  },
  parseItem: <T,>(key: string, fallback: T): T => {
    try {
      const val = safeStorage.getItem(key);
      if (!val) return fallback;
      return JSON.parse(val) as T;
    } catch (e) {
      console.warn(`JSON parsing error for key ${key}, resetting to default:`, e);
      return fallback;
    }
  }
};

interface FirebaseContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  tutors: UserProfile[];
  bookings: Booking[];
  chats: Chat[];
  messages: Message[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  toast: { show: boolean; msg: string };
  triggerToast: (msg: string) => void;
  signUp: (email: string, pass: string, name: string, role: "student" | "tutor") => Promise<void>;
  logIn: (email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
  bootstrapTutors: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  bookSession: (booking: Omit<Booking, "id">) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: Booking["status"]) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  createChatRoom: (tutorId: string) => Promise<string>;
  addFunding: (amount: number) => Promise<void>;
  withdrawFunding: (amount: number) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase must be used within a FirebaseProvider");
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, msg: "" });

  const triggerToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => {
      setToast({ show: false, msg: "" });
    }, 3000);
  };

  const getLocalBookings = (): Booking[] => {
    return safeStorage.parseItem<Booking[]>("tutorfind_bookings", []);
  };

  const saveLocalBookings = (newBookings: Booking[]) => {
    safeStorage.setItem("tutorfind_bookings", JSON.stringify(newBookings));
    if (currentUser && userProfile) {
      const filtered = newBookings.filter(b => 
        userProfile.role === "tutor" ? b.tutorId === currentUser.uid : b.studentId === currentUser.uid
      );
      filtered.sort((a, b) => {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bd - ad;
      });
      setBookings(filtered);
    }
  };

  const getLocalChats = (): Chat[] => {
    return safeStorage.parseItem<Chat[]>("tutorfind_chats", []);
  };

  const saveLocalChats = (newChats: Chat[]) => {
    safeStorage.setItem("tutorfind_chats", JSON.stringify(newChats));
    if (currentUser && userProfile) {
      const filtered = newChats.filter(c => 
        userProfile.role === "tutor" ? c.tutorId === currentUser.uid : c.studentId === currentUser.uid
      );
      filtered.sort((a, b) => b.updatedAt - a.updatedAt);
      setChats(filtered);
    }
  };

  const saveProfileLocally = (uid: string, profile: UserProfile) => {
    const localProfiles = safeStorage.parseItem<Record<string, UserProfile>>("tutorfind_user_profiles", {});
    localProfiles[uid] = profile;
    safeStorage.setItem("tutorfind_user_profiles", JSON.stringify(localProfiles));
    
    if (currentUser && currentUser.uid === uid) {
      setUserProfile(profile);
    }

    // Also sync the tutors list if they are a tutor
    if (profile.role === "tutor") {
      let localTutors = safeStorage.parseItem<UserProfile[]>("tutorfind_tutors", []);
      const idx = localTutors.findIndex((t: any) => t.uid === uid);
      if (idx !== -1) {
        localTutors[idx] = { ...localTutors[idx], ...profile };
      } else {
        localTutors = [profile, ...localTutors];
      }
      safeStorage.setItem("tutorfind_tutors", JSON.stringify(localTutors));
      setTutors(localTutors);
    }
  };

  // 1. Boostrap Initial Tutors into localStorage if they do not exist
  const bootstrapTutors = async () => {
    let localTutors = safeStorage.getItem("tutorfind_tutors");
    if (!localTutors) {
      safeStorage.setItem("tutorfind_tutors", JSON.stringify(INITIAL_TUTORS_DATA));
      setTutors(INITIAL_TUTORS_DATA);
    } else {
      setTutors(safeStorage.parseItem<UserProfile[]>("tutorfind_tutors", INITIAL_TUTORS_DATA));
    }
  };

  // 2. Main Authentication Monitoring
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setLoading(true);
        // Authenticated, check physical localStorage profile representation
        const localProfiles = safeStorage.parseItem<Record<string, UserProfile>>("tutorfind_user_profiles", {});
        let profile = localProfiles[user.uid];

        // Try load from Firestore first for true live sync
        try {
          const userRef = doc(db, "users", user.uid);
          const snap = await dbGetDoc(userRef);
          if (snap && snap.exists()) {
            profile = snap.data() as UserProfile;
            localProfiles[user.uid] = profile;
            safeStorage.setItem("tutorfind_user_profiles", JSON.stringify(localProfiles));
          }
        } catch (dbErr) {
          console.warn("Could not retrieve profile from Firestore (using local):", dbErr);
        }

        if (!profile) {
          const isTutor = user.email?.toLowerCase().includes("tutor") || false;
          profile = {
            uid: user.uid,
            name: user.displayName || user.email?.split("@")[0] || "User",
            email: user.email || "",
            role: isTutor ? "tutor" : "student",
            walletBalance: isTutor ? 0 : 2500, // gift some starting mock credits
            totalSpent: 0,
            totalEarned: 0,
            withdrawn: 0,
            online: isTutor,
            rating: isTutor ? 5.0 : undefined,
            reviewsCount: isTutor ? 12 : undefined,
            subjects: isTutor ? ["Mathematics", "Physics", "Chemistry"] : [],
            city: "Mumbai",
            rate: isTutor ? 450 : undefined,
            qual: isTutor ? "B.Tech, IIT Bombay" : undefined,
            exp: isTutor ? "4 Years" : undefined,
            bio: isTutor ? "Dedicated tutor offering highly personalized sessions." : undefined
          };
          localProfiles[user.uid] = profile;
          safeStorage.setItem("tutorfind_user_profiles", JSON.stringify(localProfiles));

          // Try write newly created profile to Firestore
          try {
            const userRef = doc(db, "users", user.uid);
            await dbSetDoc(userRef, profile);
          } catch (dbErr) {
            console.warn("Could not sync fallback profile to Firestore:", dbErr);
          }
        }
        setUserProfile(profile);

        // Load correct list of tutors from environment or Firestore
        let tutorsList: UserProfile[] = INITIAL_TUTORS_DATA as UserProfile[];
        try {
          const tutorsQuery = query(collection(db, "users"), where("role", "==", "tutor"));
          const snap = await dbGetDocs(tutorsQuery);
          if (snap && !snap.empty) {
            const fbTutors: UserProfile[] = [];
            snap.forEach((doc) => {
              fbTutors.push(doc.data() as UserProfile);
            });
            // Merge with INITIAL_TUTORS_DATA so standard demo tutors are always present if not fully populated
            const mergedTutors = [...fbTutors];
            INITIAL_TUTORS_DATA.forEach(initT => {
              if (!mergedTutors.find(t => t.uid === initT.uid)) {
                mergedTutors.push(initT as any);
              }
            });
            tutorsList = mergedTutors;
          }
        } catch (err) {
          console.warn("Failed to fetch tutors from Firestore, using local:", err);
          let localTutors = safeStorage.getItem("tutorfind_tutors");
          if (!localTutors) {
            safeStorage.setItem("tutorfind_tutors", JSON.stringify(INITIAL_TUTORS_DATA));
          } else {
            tutorsList = safeStorage.parseItem<UserProfile[]>("tutorfind_tutors", INITIAL_TUTORS_DATA as UserProfile[]);
          }
        }

        if (profile.role === "tutor") {
          const exists = tutorsList.find(t => t.uid === profile.uid);
          if (!exists) {
            tutorsList = [profile, ...tutorsList];
          } else {
            tutorsList = tutorsList.map(t => t.uid === profile.uid ? { ...t, ...profile } : t);
          }
          safeStorage.setItem("tutorfind_tutors", JSON.stringify(tutorsList));
        }
        setTutors(tutorsList);

        // Filter bookings for this user ID
        let filteredBookings: Booking[] = [];
        try {
          const fieldToQuery = profile.role === "tutor" ? "tutorId" : "studentId";
          const bookingsQuery = query(collection(db, "bookings"), where(fieldToQuery, "==", user.uid));
          const snap = await dbGetDocs(bookingsQuery);
          if (snap && !snap.empty) {
            snap.forEach(doc => {
              filteredBookings.push(doc.data() as Booking);
            });
          } else {
            // Check local fallback
            const allBookings: Booking[] = safeStorage.parseItem<Booking[]>("tutorfind_bookings", []);
            filteredBookings = allBookings.filter(b => 
              profile.role === "tutor" ? b.tutorId === user.uid : b.studentId === user.uid
            );
          }
        } catch (err) {
          console.warn("Failed to fetch bookings from Firestore, using local:", err);
          const allBookings: Booking[] = safeStorage.parseItem<Booking[]>("tutorfind_bookings", []);
          filteredBookings = allBookings.filter(b => 
            profile.role === "tutor" ? b.tutorId === user.uid : b.studentId === user.uid
          );
        }

        filteredBookings.sort((a, b) => {
          const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bd - ad;
        });
        setBookings(filteredBookings);

        // Filter chats
        let filteredChats: Chat[] = [];
        try {
          const fieldToQuery = profile.role === "tutor" ? "tutorId" : "studentId";
          const chatsQuery = query(collection(db, "chats"), where(fieldToQuery, "==", user.uid));
          const snap = await dbGetDocs(chatsQuery);
          if (snap && !snap.empty) {
            snap.forEach(doc => {
              filteredChats.push(doc.data() as Chat);
            });
          } else {
            // Check local fallback
            const allChats: Chat[] = safeStorage.parseItem<Chat[]>("tutorfind_chats", []);
            filteredChats = allChats.filter(c => 
              profile.role === "tutor" ? c.tutorId === user.uid : c.studentId === user.uid
            );
          }
        } catch (err) {
          console.warn("Failed to fetch chats from Firestore, using local:", err);
          const allChats: Chat[] = safeStorage.parseItem<Chat[]>("tutorfind_chats", []);
          filteredChats = allChats.filter(c => 
            profile.role === "tutor" ? c.tutorId === user.uid : c.studentId === user.uid
          );
        }

        filteredChats.sort((a, b) => b.updatedAt - a.updatedAt);
        setChats(filteredChats);

        setLoading(false);
      } else {
        setUserProfile(null);
        setBookings([]);
        setChats([]);
        setMessages([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [currentUser?.uid]);

  // Loading Tutors initially representational
  useEffect(() => {
    bootstrapTutors();
  }, []);

  // Listen to active chat messages
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    // Load local messages first as a fallback
    const allMessages = safeStorage.parseItem<Record<string, Message[]>>("tutorfind_messages", {});
    const chatMsgs = allMessages[activeChatId] || [];
    setMessages(chatMsgs);

    // Subscribe to real-time changes of this chat's messages in Firestore
    let unsubscribed = false;
    const messagesRef = collection(db, "chats", activeChatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = dbOnSnapshot(q, (snap) => {
      if (unsubscribed) return;
      const fbMsgs: Message[] = [];
      snap.forEach((doc: any) => {
        fbMsgs.push(doc.data() as Message);
      });
      if (fbMsgs.length > 0) {
        setMessages(fbMsgs);
        // Sync back to local storage
        const currentMessages = safeStorage.parseItem<Record<string, Message[]>>("tutorfind_messages", {});
        currentMessages[activeChatId] = fbMsgs;
        safeStorage.setItem("tutorfind_messages", JSON.stringify(currentMessages));
      }
    }, (err) => {
      console.warn("Firestore real-time messages listener bypassed/uninitialized:", err);
    });

    return () => {
      unsubscribed = true;
      unsubscribe();
    };
  }, [activeChatId]);

  // Authenticated transactions
  const signUp = async (email: string, pass: string, name: string, role: "student" | "tutor") => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = cred.user.uid;

      const profile: UserProfile = {
        uid,
        name,
        email,
        role,
        avatar: name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U",
        color: ["#4f46e5", "#059669", "#7c3aed", "#2563eb", "red", "purple", "amber"].sort(() => 0.5 - Math.random())[0],
        walletBalance: role === "student" ? 2500 : 0, // Gift new students with test credits
        totalSpent: 0,
        totalEarned: 0,
        withdrawn: 0,
        online: role === "tutor",
        rating: role === "tutor" ? 5.0 : undefined,
        reviewsCount: role === "tutor" ? 0 : undefined,
        subjects: [],
        city: ""
      };

      saveProfileLocally(uid, profile);

      // Save user profile genuinely in the Firebase database!
      try {
        const userRef = doc(db, "users", uid);
        await dbSetDoc(userRef, profile);
      } catch (dbErr) {
        console.warn("Firestore sign-up save bypassed:", dbErr);
      }

      triggerToast(`Account created as ${role}! 🎉`);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use" || (err.message && err.message.includes("email-already-in-use"))) {
        const errMsg = "User already exists. Please sign in";
        triggerToast(errMsg);
        throw new Error(errMsg);
      } else {
        const errMsg = err.message || "Registration failed.";
        triggerToast(errMsg);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const localProfiles = JSON.parse(localStorage.getItem("tutorfind_user_profiles") || "{}");
      const profile = localProfiles[cred.user.uid];
      if (profile) {
        setUserProfile(profile);
      }
      triggerToast("Logged in successfully! 👋");
    } catch (err: any) {
      console.error(err);
      const errMsg = "Email or password is incorrect";
      triggerToast(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
      setActiveChatId(null);
      triggerToast("Signed out successfully.");
    } catch (err) {
      console.error(err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    try {
      const updated = { ...userProfile, ...updates };
      saveProfileLocally(currentUser.uid, updated);
      
      // Genuinely save it to the Firebase Firestore Database!
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await dbSetDoc(userRef, updated, { merge: true });
        console.log("Profile updated in Firebase Firestore database successfully.");
      } catch (dbErr) {
        console.warn("Firestore save bypassed (running off generic credentials or sandbox):", dbErr);
      }

      triggerToast("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update profile.");
    }
  };

  const addFunding = async (amount: number) => {
    if (!currentUser || !userProfile) return;
    try {
      const currentBalance = userProfile.walletBalance || 0;
      const updated = { ...userProfile, walletBalance: currentBalance + amount };
      saveProfileLocally(currentUser.uid, updated);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        await dbSetDoc(userRef, updated, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore funding save bypassed:", dbErr);
      }

      triggerToast(`Successfully added ₹${amount} to your wallet!`);
    } catch (err) {
      console.error(err);
    }
  };

  const withdrawFunding = async (amount: number) => {
    if (!currentUser || !userProfile) return;
    const currentBalance = userProfile.walletBalance || 0;
    if (currentBalance < amount) {
      triggerToast("Insufficient balance for withdrawal.");
      return;
    }
    try {
      const updated = {
        ...userProfile,
        walletBalance: currentBalance - amount,
        withdrawn: (userProfile.withdrawn || 0) + amount
      };
      saveProfileLocally(currentUser.uid, updated);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        await dbSetDoc(userRef, updated, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore withdraw funding save bypassed:", dbErr);
      }

      triggerToast(`Withdrawn ₹${amount} successfully! Transfer routed to your Bank.`);
    } catch (err) {
      console.error(err);
    }
  };

  const bookSession = async (bookingData: Omit<Booking, "id">) => {
    if (!currentUser || !userProfile) return;
    try {
      const fee = bookingData.rate;
      const currentBalance = userProfile.walletBalance || 0;
      if (currentBalance < fee) {
        triggerToast("Insufficient wallet funds. Please add money first!");
        return;
      }

      const newId = "book_" + Date.now();
      const booking: Booking = {
        ...bookingData,
        id: newId,
        createdAt: new Date().toISOString()
      };

      const allBookings = getLocalBookings();
      allBookings.push(booking);
      saveLocalBookings(allBookings);

      const updatedStudent = {
        ...userProfile,
        walletBalance: currentBalance - fee,
        totalSpent: (userProfile.totalSpent || 0) + fee
      };
      saveProfileLocally(currentUser.uid, updatedStudent);

      // Sync booking and student balance update to Firestore
      try {
        const bookingRef = doc(db, "bookings", newId);
        await dbSetDoc(bookingRef, booking);

        const studentRef = doc(db, "users", currentUser.uid);
        await dbSetDoc(studentRef, updatedStudent, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore booking sync bypassed:", dbErr);
      }

      triggerToast("Session requested successfully! 🎉");
    } catch (err) {
      console.error(err);
      triggerToast("Booking request failed.");
    }
  };

  const updateBookingStatus = async (bookingId: string, status: Booking["status"]) => {
    if (!currentUser || !userProfile) return;
    try {
      const allBookings = getLocalBookings();
      const bookingIdx = allBookings.findIndex(b => b.id === bookingId);
      if (bookingIdx === -1) return;

      allBookings[bookingIdx].status = status;
      saveLocalBookings(allBookings);

      const booking = allBookings[bookingIdx];

      // Sync status to Firestore booking doc
      try {
        const bookingRef = doc(db, "bookings", bookingId);
        await dbSetDoc(bookingRef, { status }, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore status update sync bypassed:", dbErr);
      }

      if (status === "confirmed") {
        const tutorId = booking.tutorId;
        const localProfiles = safeStorage.parseItem<Record<string, UserProfile>>("tutorfind_user_profiles", {});
        const tutorData = localProfiles[tutorId];
        if (tutorData) {
          tutorData.walletBalance = (tutorData.walletBalance || 0) + booking.rate;
          tutorData.totalEarned = (tutorData.totalEarned || 0) + booking.rate;
          saveProfileLocally(tutorId, tutorData);

          try {
            const tutorRef = doc(db, "users", tutorId);
            await dbSetDoc(tutorRef, tutorData, { merge: true });
          } catch (dbErr) {
            console.warn("Firestore tutor wallet transfer sync bypassed:", dbErr);
          }
        }
        triggerToast("Request accepted, session scheduled!");
      } else if (status === "cancelled") {
        const studentId = booking.studentId;
        const localProfiles = safeStorage.parseItem<Record<string, UserProfile>>("tutorfind_user_profiles", {});
        const studentData = localProfiles[studentId];
        if (studentData) {
          studentData.walletBalance = (studentData.walletBalance || 0) + booking.rate;
          studentData.totalSpent = Math.max(0, (studentData.totalSpent || 0) - booking.rate);
          saveProfileLocally(studentId, studentData);

          try {
            const studentRef = doc(db, "users", studentId);
            await dbSetDoc(studentRef, studentData, { merge: true });
          } catch (dbErr) {
            console.warn("Firestore refund transaction sync bypassed:", dbErr);
          }
        }
        triggerToast("Session cancelled and student refunded.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update status.");
    }
  };

  const createChatRoom = async (tutorId: string): Promise<string> => {
    if (!currentUser || !userProfile) throw new Error("Authentication required");
    const isTutor = userProfile.role === "tutor";
    const studentId = isTutor ? tutorId : currentUser.uid;
    const resolvedTutorId = isTutor ? currentUser.uid : tutorId;

    const roomId = `${studentId}_${resolvedTutorId}`;

    try {
      const allChats = getLocalChats();
      let chat = allChats.find(c => c.id === roomId);

      if (!chat) {
        const localProfiles = safeStorage.parseItem<Record<string, UserProfile>>("tutorfind_user_profiles", {});
        const student = localProfiles[studentId];
        const tutor = localProfiles[resolvedTutorId];

        chat = {
          id: roomId,
          studentId,
          tutorId: resolvedTutorId,
          lastMsg: "Connected. Click here to chat!",
          updatedAt: Date.now(),
          studentName: student?.name || "Student",
          tutorName: tutor?.name || "Tutor",
          studentColor: student?.color || "#111111",
          tutorColor: tutor?.color || "#4f46e5",
          studentAvatar: student?.avatar || "S",
          tutorAvatar: tutor?.avatar || "T",
          studentUnread: 0,
          tutorUnread: 0
        };
        allChats.push(chat);
        saveLocalChats(allChats);

        // Sync chat room to Firestore
        try {
          const chatRef = doc(db, "chats", roomId);
          await dbSetDoc(chatRef, chat);
        } catch (dbErr) {
          console.warn("Firestore chat creation sync bypassed:", dbErr);
        }
      }

      return roomId;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const sendMessage = async (text: string) => {
    if (!currentUser || !activeChatId || !userProfile) return;
    const msgId = "msg_" + Date.now();
    try {
      const allMsgObj = safeStorage.parseItem<Record<string, Message[]>>("tutorfind_messages", {});
      const chatMsgs = allMsgObj[activeChatId] || [];

      const newMsg: Message = {
        id: msgId,
        senderId: currentUser.uid,
        text,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        createdAt: Date.now()
      };
      chatMsgs.push(newMsg);
      allMsgObj[activeChatId] = chatMsgs;
      safeStorage.setItem("tutorfind_messages", JSON.stringify(allMsgObj));
      setMessages([...chatMsgs]);

      // Sync message to Firestore subcollection
      try {
        const msgRef = doc(db, "chats", activeChatId, "messages", msgId);
        await dbSetDoc(msgRef, newMsg);

        // Update last message in Firestore parent chat room
        const chatRef = doc(db, "chats", activeChatId);
        const isTutor = userProfile.role === "tutor";
        await dbSetDoc(chatRef, {
          lastMsg: text,
          updatedAt: Date.now(),
          studentUnread: isTutor ? 1 : 0,
          tutorUnread: isTutor ? 0 : 1
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore message send sync bypassed:", dbErr);
      }

      // Update parent chat room locally
      const allChats = getLocalChats();
      const chatIdx = allChats.findIndex(c => c.id === activeChatId);
      const isTutor = userProfile.role === "tutor";
      if (chatIdx !== -1) {
        allChats[chatIdx].lastMsg = text;
        allChats[chatIdx].updatedAt = Date.now();
        allChats[chatIdx].studentUnread = isTutor ? 1 : 0;
        allChats[chatIdx].tutorUnread = isTutor ? 0 : 1;
        saveLocalChats(allChats);
      }

      // Trigger automatic AI reply safely mimicking natural dialogues (only for bot interactions)
      const opposingId = activeChatId.split("_").find(id => id !== currentUser.uid) || "system";
      if (opposingId.startsWith("tutor_") || opposingId === "system" || opposingId.includes("demo")) {
        setTimeout(async () => {
          try {
            const autoAnswers = [
              "Hello! I saw your request. Let's cover this next class! 👍",
              "Perfect. I am preparing some sample worksheets for you.",
              "Sure! That sounds clear. We'll start with basics first.",
              "Great! Looking forward to our scheduled session.",
              "Got your message. Let's make sure we do some mock tests.",
              "Understood. If you have any homework material, share it here!",
              "Excellent. See you soon in class! 😊"
            ];
            const mockAnswer = autoAnswers[Math.floor(Math.random() * autoAnswers.length)];
            const autoMsgId = "msg_auto_" + Date.now();

            const autoMsg: Message = {
              id: autoMsgId,
              senderId: opposingId,
              text: mockAnswer,
              time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
              createdAt: Date.now()
            };

            // Write AI answer to Firestore subcollection
            try {
              const autoMsgRef = doc(db, "chats", activeChatId, "messages", autoMsgId);
              await dbSetDoc(autoMsgRef, autoMsg);

              const chatRef = doc(db, "chats", activeChatId);
              await dbSetDoc(chatRef, {
                lastMsg: mockAnswer,
                updatedAt: Date.now(),
                studentUnread: isTutor ? 0 : 1,
                tutorUnread: isTutor ? 1 : 0
              }, { merge: true });
            } catch (dbErr) {
              console.warn("Firestore auto-reply sync bypassed:", dbErr);
            }

            // Sync locally as fallback
            const freshAllMsgObj = safeStorage.parseItem<Record<string, Message[]>>("tutorfind_messages", {});
            const freshChatMsgs = freshAllMsgObj[activeChatId] || [];
            freshChatMsgs.push(autoMsg);
            freshAllMsgObj[activeChatId] = freshChatMsgs;
            safeStorage.setItem("tutorfind_messages", JSON.stringify(freshAllMsgObj));
            
            setMessages([...freshChatMsgs]);

            const freshChats = getLocalChats();
            const freshChatIdx = freshChats.findIndex(c => c.id === activeChatId);
            if (freshChatIdx !== -1) {
              freshChats[freshChatIdx].lastMsg = mockAnswer;
              freshChats[freshChatIdx].updatedAt = Date.now();
              freshChats[freshChatIdx].studentUnread = isTutor ? 0 : 1;
              freshChats[freshChatIdx].tutorUnread = isTutor ? 1 : 0;
              saveLocalChats(freshChats);
            }
          } catch (autoErr) {
            console.warn("Auto-reply silent fail", autoErr);
          }
        }, 2000);
      }

    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  return (
    <FirebaseContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      tutors,
      bookings,
      chats,
      messages,
      activeChatId,
      setActiveChatId,
      toast,
      triggerToast,
      signUp,
      logIn,
      logOut,
      bootstrapTutors,
      updateProfile,
      bookSession,
      updateBookingStatus,
      sendMessage,
      createChatRoom,
      addFunding,
      withdrawFunding,
      setMessages
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};
