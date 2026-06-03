import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs,
  setDoc,
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { 
  auth, 
  db, 
  dbGetDoc, 
  dbSetDoc, 
  dbUpdateDoc, 
  dbAddDoc, 
  dbOnSnapshot, 
  OperationType,
  handleFirestoreError
} from "./firebase";
import { UserProfile, Booking, Chat, Message } from "./types";
import { INITIAL_TUTORS_DATA } from "./constants";

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

  // 1. Boostrap Initial Tutors into Firestore if they do not exist
  const bootstrapTutors = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "tutor"));
      const snap = await getDocs(q);
      if (snap.empty) {
        console.log("No default tutors found. Bootstrapping initial database profiles...");
        for (const tutor of INITIAL_TUTORS_DATA) {
          // Store each tutor in the 'users' collection
          await setDoc(doc(db, "users", tutor.uid), {
            uid: tutor.uid,
            name: tutor.name,
            email: tutor.email,
            city: tutor.city,
            subjects: tutor.subjects,
            grade: tutor.grade,
            rate: tutor.rate,
            rating: tutor.rating,
            reviewsCount: tutor.reviewsCount,
            mode: tutor.mode,
            exp: tutor.exp,
            bio: tutor.bio,
            avatar: tutor.avatar,
            color: tutor.color,
            online: tutor.online,
            qual: tutor.qual,
            role: tutor.role,
            walletBalance: 0,
            totalEarned: 0,
            withdrawn: 0
          });
        }
      }
    } catch (err) {
      console.warn("Bootstrap tutor failed or blocked by rules. This is expected if unsigned.", err);
    }
  };

  // 2. Main Authentication Monitoring
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Authenticated, listen to their user profile
        const profileRef = doc(db, "users", user.uid);
        const unsubscribeProfile = dbOnSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile({
              uid: user.uid,
              name: user.displayName || user.email?.split("@")[0] || "User",
              email: user.email || "",
              role: "student",
              walletBalance: 1000, // initial funding
              totalSpent: 0
            });
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile listen error:", err);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 3. Real-time lists for tutors, bookings, and chats
  useEffect(() => {
    // Run bootstrapping once DB client starts up
    bootstrapTutors();

    // Listen to all tutors in real-time
    const tutorsQuery = query(collection(db, "users"), where("role", "==", "tutor"));
    const unsubTutors = dbOnSnapshot(tutorsQuery, (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((doc: any) => {
        list.push(doc.data() as UserProfile);
      });
      setTutors(list);
    });

    return () => unsubTutors();
  }, []);

  // Listen to bookings and chats when user is authenticated
  useEffect(() => {
    if (!currentUser || !userProfile) {
      setBookings([]);
      setChats([]);
      return;
    }

    const uid = currentUser.uid;
    const isTutor = userProfile.role === "tutor";

    // Listen to bookings
    const bookingsQuery = isTutor
      ? query(collection(db, "bookings"), where("tutorId", "==", uid))
      : query(collection(db, "bookings"), where("studentId", "==", uid));

    const unsubBookings = dbOnSnapshot(bookingsQuery, (snap) => {
      const list: Booking[] = [];
      snap.forEach((doc: any) => {
        list.push(doc.data() as Booking);
      });
      // Sort bookings by creation date
      list.sort((a, b) => {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bd - ad;
      });
      setBookings(list);
    });

    // Listen to chats
    const chatsQuery = isTutor
      ? query(collection(db, "chats"), where("tutorId", "==", uid))
      : query(collection(db, "chats"), where("studentId", "==", uid));

    const unsubChats = dbOnSnapshot(chatsQuery, (snap) => {
      const list: Chat[] = [];
      snap.forEach((doc: any) => {
        list.push(doc.data() as Chat);
      });
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      setChats(list);
    });

    return () => {
      unsubBookings();
      unsubChats();
    };
  }, [currentUser, userProfile?.role]);

  // Listen to active chat messages
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const msgsQuery = query(
      collection(db, "chats", activeChatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubMsgs = dbOnSnapshot(msgsQuery, (snap) => {
      const list: Message[] = [];
      snap.forEach((doc: any) => {
        list.push(doc.data() as Message);
      });
      setMessages(list);
    }, (err) => {
      console.warn("Message snap failed, might need indexing or first creation", err);
    });

    return () => unsubMsgs();
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

      await dbSetDoc(doc(db, "users", uid), profile);
      setUserProfile(profile);
      triggerToast(`Account created as ${role}! 🎉`);
    } catch (err) {
      console.error(err);
      triggerToast(err instanceof Error ? err.message : "Registration failed.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profileSnap = await dbGetDoc(doc(db, "users", cred.user.uid));
      if (profileSnap && profileSnap.exists()) {
        setUserProfile(profileSnap.data() as UserProfile);
      }
      triggerToast("Logged in successfully! 👋");
    } catch (err) {
      console.error(err);
      triggerToast(err instanceof Error ? err.message : "Authentication failed.");
      throw err;
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
    if (!currentUser) return;
    try {
      const ref = doc(db, "users", currentUser.uid);
      await dbUpdateDoc(ref, updates);
      triggerToast("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update profile.");
    }
  };

  const addFunding = async (amount: number) => {
    if (!currentUser || !userProfile) return;
    try {
      const ref = doc(db, "users", currentUser.uid);
      const currentBalance = userProfile.walletBalance || 0;
      await dbUpdateDoc(ref, {
        walletBalance: currentBalance + amount
      });
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
      const ref = doc(db, "users", currentUser.uid);
      await dbUpdateDoc(ref, {
        walletBalance: currentBalance - amount,
        withdrawn: (userProfile.withdrawn || 0) + amount
      });
      triggerToast(`Withdrawn ₹${amount} successfully! Transfer routed to your Bank.`);
    } catch (err) {
      console.error(err);
    }
  };

  const bookSession = async (bookingData: Omit<Booking, "id">) => {
    if (!currentUser || !userProfile) return;
    try {
      // Check if student has sufficient funds
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

      // Set booking in Firestore
      await dbSetDoc(doc(db, "bookings", newId), booking);

      // Deduct from student wallet instantly to lock the session fee
      await dbUpdateDoc(doc(db, "users", currentUser.uid), {
        walletBalance: currentBalance - fee,
        totalSpent: (userProfile.totalSpent || 0) + fee
      });

      triggerToast("Session requested successfully! 🎉");
    } catch (err) {
      console.error(err);
      triggerToast("Booking request failed.");
    }
  };

  const updateBookingStatus = async (bookingId: string, status: Booking["status"]) => {
    if (!currentUser || !userProfile) return;
    try {
      const ref = doc(db, "bookings", bookingId);
      await dbUpdateDoc(ref, { status });

      // If accepted/confirmed, credit the tutor's wallet
      const bookingSnap = await dbGetDoc(ref);
      if (bookingSnap && bookingSnap.exists()) {
        const booking = bookingSnap.data() as Booking;
        if (status === "confirmed") {
          // Tutor gets funded
          const tutorId = booking.tutorId;
          const tutorSnap = await dbGetDoc(doc(db, "users", tutorId));
          if (tutorSnap.exists()) {
            const tutorData = tutorSnap.data() as UserProfile;
            await dbUpdateDoc(doc(db, "users", tutorId), {
              walletBalance: (tutorData.walletBalance || 0) + booking.rate,
              totalEarned: (tutorData.totalEarned || 0) + booking.rate
            });
          }
          triggerToast("Request accepted, session scheduled!");
        } else if (status === "cancelled") {
          // Refund student
          const studentId = booking.studentId;
          const studentSnap = await dbGetDoc(doc(db, "users", studentId));
          if (studentSnap.exists()) {
            const studentData = studentSnap.data() as UserProfile;
            await dbUpdateDoc(doc(db, "users", studentId), {
              walletBalance: (studentData.walletBalance || 0) + booking.rate,
              totalSpent: Math.max(0, (studentData.totalSpent || 0) - booking.rate)
            });
          }
          triggerToast("Session cancelled and student refunded.");
        }
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
      const chatRef = doc(db, "chats", roomId);
      const chatSnap = await dbGetDoc(chatRef);

      if (!chatSnap.exists()) {
        const studentSnap = await dbGetDoc(doc(db, "users", studentId));
        const tutorSnap = await dbGetDoc(doc(db, "users", resolvedTutorId));

        const student = studentSnap.data() as UserProfile;
        const tutor = tutorSnap.data() as UserProfile;

        await dbSetDoc(chatRef, {
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
        });
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
      // Add message document
      const msgRef = doc(db, "chats", activeChatId, "messages", msgId);
      await dbSetDoc(msgRef, {
        id: msgId,
        senderId: currentUser.uid,
        text,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        createdAt: Date.now()
      });

      // Update parent chat room
      const chatRef = doc(db, "chats", activeChatId);
      const isTutor = userProfile.role === "tutor";
      await dbUpdateDoc(chatRef, {
        lastMsg: text,
        updatedAt: Date.now(),
        studentUnread: isTutor ? 1 : 0,
        tutorUnread: isTutor ? 0 : 1
      });

      // Trigger automatic AI reply safely mimicking natural dialogues
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
          const opposingId = activeChatId.split("_").find(id => id !== currentUser.uid) || "system";

          await dbSetDoc(doc(db, "chats", activeChatId, "messages", autoMsgId), {
            id: autoMsgId,
            senderId: opposingId,
            text: mockAnswer,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            createdAt: Date.now()
          });

          await dbUpdateDoc(chatRef, {
            lastMsg: mockAnswer,
            updatedAt: Date.now(),
            studentUnread: isTutor ? 0 : 1,
            tutorUnread: isTutor ? 1 : 0
          });
        } catch (autoErr) {
          console.warn("Auto-reply silent fail (likely normal rule restriction)", autoErr);
        }
      }, 2000);

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
