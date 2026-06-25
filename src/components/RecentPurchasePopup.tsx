"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, BookOpen, Heart, ShoppingBag, Mail } from "lucide-react";

interface PurchaseEvent {
  id: number;
  name: string;
  location: string;
  activity: string;
  time: string;
  type: "journal" | "servant" | "tube" | "lms" | "scroll";
}

const PURCHASE_EVENTS: PurchaseEvent[] = [
  {
    id: 1,
    name: "Rachel",
    location: "Nashville, TN",
    activity: "just ordered the Serenity Scrolls Tube",
    time: "2 mins ago",
    type: "tube"
  },
  {
    id: 2,
    name: "David",
    location: "Grand Rapids, MI",
    activity: "unlocked KJV Scripture Companion Access",
    time: "5 mins ago",
    type: "servant"
  },
  {
    id: 3,
    name: "Grace",
    location: "Atlanta, GA",
    activity: "ordered the Reflection Journal & Devotional",
    time: "12 mins ago",
    type: "journal"
  },
  {
    id: 4,
    name: "Joshua",
    location: "Orlando, FL",
    activity: "enrolled in the Courage Covenant™ Course",
    time: "18 mins ago",
    type: "lms"
  },
  {
    id: 5,
    name: "Hannah",
    location: "St. Paul, MN",
    activity: "unlocked KJV verses for 'Anxiety & Peace'",
    time: "24 mins ago",
    type: "scroll"
  },
  {
    id: 6,
    name: "Samuel",
    location: "Charlotte, NC",
    activity: "ordered the Serenity Scrolls Tube",
    time: "32 mins ago",
    type: "tube"
  },
  {
    id: 7,
    name: "Rebecca",
    location: "Houston, TX",
    activity: "started the 'Soul’s Reset' 5-Email Series",
    time: "41 mins ago",
    type: "scroll"
  },
  {
    id: 8,
    name: "Matthew",
    location: "Denver, CO",
    activity: "ordered the Reflection Journal",
    time: "55 mins ago",
    type: "journal"
  },
  {
    id: 9,
    name: "Sarah",
    location: "Dallas, TX",
    activity: "enrolled in the Courage Covenant™ LMS",
    time: "1 hr ago",
    type: "lms"
  },
  {
    id: 10,
    name: "Michael",
    location: "Austin, TX",
    activity: "unlocked daily KJV Scripture snapshots",
    time: "1 hr ago",
    type: "servant"
  }
];

export function RecentPurchasePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<PurchaseEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    // Initial show after 6 seconds
    const initialTimer = setTimeout(() => {
      showRandomEvent();
    }, 6000);

    return () => clearTimeout(initialTimer);
  }, [isDismissed]);

  const showRandomEvent = () => {
    if (isDismissed) return;

    const randomIndex = Math.floor(Math.random() * PURCHASE_EVENTS.length);
    setCurrentEvent(PURCHASE_EVENTS[randomIndex]);
    setIsVisible(true);

    // Hide after 7 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      
      // Schedule next event in 15-25 seconds
      const nextDelay = Math.floor(Math.random() * 10000) + 15000;
      const nextTimer = setTimeout(() => {
        showRandomEvent();
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
      default:
        return <Mail className="w-4.5 h-4.5 text-primary" />;
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
