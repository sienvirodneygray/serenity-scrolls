"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, BookOpen, Heart, ShoppingBag } from "lucide-react";

interface PurchaseEvent {
  id: number;
  name: string;
  location: string;
  activity: string;
  time: string;
  type: "journal" | "servant" | "tube" | "lms" | "scroll" | "shop";
}

const PURCHASE_EVENTS: PurchaseEvent[] = [
  // — Tube orders —
  { id: 1, name: "Rachel", location: "Nashville, TN", activity: "just ordered the Serenity Scrolls Tube", time: "2 mins ago", type: "tube" },
  { id: 2, name: "Samuel", location: "Charlotte, NC", activity: "ordered the Serenity Scrolls Tube", time: "8 mins ago", type: "tube" },
  { id: 3, name: "Esther", location: "Phoenix, AZ", activity: "purchased the Serenity Scrolls Tube Set", time: "14 mins ago", type: "tube" },
  { id: 4, name: "Caleb", location: "Portland, OR", activity: "just bought the Serenity Scrolls Tube as a gift", time: "22 mins ago", type: "tube" },

  // — Journal purchases —
  { id: 5, name: "Grace", location: "Atlanta, GA", activity: "ordered the Reflection Journal & Devotional", time: "6 mins ago", type: "journal" },
  { id: 6, name: "Matthew", location: "Denver, CO", activity: "ordered the Reflection Journal", time: "19 mins ago", type: "journal" },
  { id: 7, name: "Naomi", location: "San Diego, CA", activity: "purchased 2 Reflection Journals", time: "35 mins ago", type: "journal" },
  { id: 8, name: "Elijah", location: "Raleigh, NC", activity: "bought a Reflection Journal for a friend", time: "43 mins ago", type: "journal" },

  // — Servant access / KJV Companion —
  { id: 9, name: "David", location: "Grand Rapids, MI", activity: "unlocked KJV Scripture Companion Access", time: "5 mins ago", type: "servant" },
  { id: 10, name: "Michael", location: "Austin, TX", activity: "unlocked daily KJV Scripture snapshots", time: "29 mins ago", type: "servant" },
  { id: 11, name: "Abigail", location: "Memphis, TN", activity: "activated her Servant trial from Amazon", time: "37 mins ago", type: "servant" },
  { id: 12, name: "Daniel", location: "Columbus, OH", activity: "redeemed KJV Companion access", time: "48 mins ago", type: "servant" },

  // — LMS / Courage Covenant —
  { id: 13, name: "Joshua", location: "Orlando, FL", activity: "enrolled in the Courage Covenant™ Course", time: "11 mins ago", type: "lms" },
  { id: 14, name: "Sarah", location: "Dallas, TX", activity: "enrolled in the Courage Covenant™ LMS", time: "33 mins ago", type: "lms" },
  { id: 15, name: "Lydia", location: "Sacramento, CA", activity: "completed Lesson 3 of Courage Covenant™", time: "52 mins ago", type: "lms" },
  { id: 16, name: "Aaron", location: "Louisville, KY", activity: "just started the Courage Covenant™ Course", time: "1 hr ago", type: "lms" },

  // — Scrolls / Scripture topics —
  { id: 17, name: "Hannah", location: "St. Paul, MN", activity: "unlocked KJV verses for 'Anxiety & Peace'", time: "15 mins ago", type: "scroll" },
  { id: 18, name: "Priscilla", location: "Savannah, GA", activity: "browsed scrolls on 'Strength in Suffering'", time: "27 mins ago", type: "scroll" },
  { id: 19, name: "Jonathan", location: "Boise, ID", activity: "saved KJV verses on 'Faith Over Fear'", time: "39 mins ago", type: "scroll" },
  { id: 20, name: "Miriam", location: "Tulsa, OK", activity: "unlocked scrolls for 'Forgiveness & Grace'", time: "50 mins ago", type: "scroll" },

  // — Shop activity —
  { id: 21, name: "Ruth", location: "Kansas City, MO", activity: "added the Devotional Bundle to cart", time: "3 mins ago", type: "shop" },
  { id: 22, name: "Luke", location: "Tampa, FL", activity: "just checked out with 3 items", time: "10 mins ago", type: "shop" },
  { id: 23, name: "Leah", location: "Minneapolis, MN", activity: "purchased a gift bundle for her small group", time: "26 mins ago", type: "shop" },
  { id: 24, name: "Isaac", location: "Birmingham, AL", activity: "ordered the Journal + Scrolls Tube combo", time: "44 mins ago", type: "shop" },
];

// Fisher-Yates shuffle to guarantee no repetition until all events are shown
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Randomize the "time" label so it feels fresh each cycle
const TIME_LABELS = [
  "just now", "1 min ago", "2 mins ago", "3 mins ago", "5 mins ago",
  "7 mins ago", "10 mins ago", "12 mins ago", "15 mins ago", "18 mins ago",
  "22 mins ago", "25 mins ago", "30 mins ago", "38 mins ago", "45 mins ago",
  "52 mins ago", "1 hr ago",
];

export function RecentPurchasePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<PurchaseEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [queue, setQueue] = useState<PurchaseEvent[]>([]);

  const getNextEvent = () => {
    let q = queue;
    if (q.length === 0) {
      q = shuffleArray(PURCHASE_EVENTS);
    }
    const next = q[0];
    const rest = q.slice(1);
    setQueue(rest);

    // Randomize the time label
    const randomTime = TIME_LABELS[Math.floor(Math.random() * TIME_LABELS.length)];
    return { ...next, time: randomTime };
  };

  useEffect(() => {
    if (isDismissed) return;

    // Initial show after 6 seconds
    const initialTimer = setTimeout(() => {
      showNextEvent();
    }, 6000);

    return () => clearTimeout(initialTimer);
  }, [isDismissed]);

  const showNextEvent = () => {
    if (isDismissed) return;

    const event = getNextEvent();
    setCurrentEvent(event);
    setIsVisible(true);

    // Hide after 7 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      
      // Schedule next event in 15-25 seconds
      const nextDelay = Math.floor(Math.random() * 10000) + 15000;
      const nextTimer = setTimeout(() => {
        showNextEvent();
      }, nextDelay);

      return () => clearTimeout(nextTimer);
    }, 7000);

    return () => clearTimeout(hideTimer);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (!currentEvent || isDismissed) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "journal":
        return <ShoppingBag className="w-4.5 h-4.5 text-pink-500" />;
      case "servant":
        return <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />;
      case "tube":
        return <ShoppingBag className="w-4.5 h-4.5 text-purple-500" />;
      case "lms":
        return <BookOpen className="w-4.5 h-4.5 text-blue-500" />;
      case "scroll":
        return <Heart className="w-4.5 h-4.5 text-emerald-500" />;
      case "shop":
        return <ShoppingBag className="w-4.5 h-4.5 text-indigo-500" />;
      default:
        return <ShoppingBag className="w-4.5 h-4.5 text-primary" />;
    }
  };

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 max-w-sm w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg rounded-2xl p-4 transition-all duration-500 transform ${
        isVisible 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}
    >
      <div className="flex gap-3.5 items-start">
        {/* Rounded Icon Wrapper */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-sm">
          {getIcon(currentEvent.type)}
        </div>

        {/* Details text */}
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Verified Activity • {currentEvent.time}
          </p>
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-0.5 leading-snug">
            {currentEvent.name} <span className="font-normal text-zinc-500 dark:text-zinc-400">from {currentEvent.location}</span>
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-normal font-medium">
            {currentEvent.activity}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
