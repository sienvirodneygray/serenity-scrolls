"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import ReactMarkdown from "react-markdown";
import { Lock } from "lucide-react";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  content_body: string;
  video_url?: string;
  duration_minutes: number;
  is_free_preview: boolean;
  escalation_level?: "green" | "yellow" | "red" | null;
  order_index: number;
}
interface Module {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  badge_label?: string;
  course_lessons: Lesson[];
}
interface Props {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>;
}

const ESCALATION_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  green: { label: "🟢 Green Level", color: "var(--grateful)", bg: "hsl(var(--grateful-light) / 0.1)", border: "hsl(var(--grateful) / 0.2)" },
  yellow: { label: "🟡 Yellow Level", color: "var(--accent-foreground)", bg: "hsl(var(--accent) / 0.2)", border: "hsl(var(--accent-foreground) / 0.2)" },
  red: { label: "🔴 Red — Escalate Immediately", color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.1)", border: "hsl(var(--destructive) / 0.2)" },
};

export default function LessonPlayer({ params }: Props) {
  const { moduleSlug, lessonSlug } = use(params);
  const courseSlug = "courage-covenant"; // Hardcoded because of folder structure
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [enrolled, setEnrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiPanel, setAiPanel] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  useEffect(() => {
    async function load() {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      // Fetch course modules + lessons
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", courseSlug)
        .single();

      if (!course) return;

      const { data: mods } = await supabase
        .from("course_modules")
        .select("*, course_lessons(*)")
        .eq("course_id", course.id)
        .order("order_index");

      if (mods) {
        const sorted = mods.map((m: Module) => ({
          ...m,
          course_lessons: [...m.course_lessons].sort((a, b) => a.order_index - b.order_index),
        }));
        setModules(sorted);

        // Find current lesson
        const mod = sorted.find((m: Module) => m.slug === moduleSlug);
        const lesson = mod?.course_lessons.find((l: Lesson) => l.slug === lessonSlug) ?? null;
        setCurrentLesson(lesson);
      }

      // Check enrollment and admin status
      if (user) {
        const { data: enrollment } = await supabase
          .from("course_enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .maybeSingle();

        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        const isUserAdmin = !!userRole;
        setIsAdmin(isUserAdmin);
        setEnrolled(!!enrollment || isUserAdmin);

        // Fetch progress
        const { data: progress } = await supabase
          .from("user_lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .not("completed_at", "is", null);
        if (progress) setCompletedLessons(new Set(progress.map((p: { lesson_id: string }) => p.lesson_id)));
      }
    }
    load();
  }, [courseSlug, moduleSlug, lessonSlug]);

  const markComplete = useCallback(async () => {
    if (!userId || !currentLesson) return;
    setMarking(true);
    const { data: course } = await supabase.from("courses").select("id").eq("slug", courseSlug).single();
    if (course) {
      await supabase.from("user_lesson_progress").upsert({
        user_id: userId,
        lesson_id: currentLesson.id,
        course_id: course.id,
        completed_at: new Date().toISOString(),
        last_visited_at: new Date().toISOString(),
      }, { onConflict: "user_id,lesson_id" });
      setCompletedLessons(prev => new Set([...prev, currentLesson.id]));
    }
    setMarking(false);

    // Navigate to next lesson
    const allLessons = modules.flatMap(m => m.course_lessons);
    const idx = allLessons.findIndex(l => l.id === currentLesson.id);
    if (idx < allLessons.length - 1) {
      const next = allLessons[idx + 1];
      const nextMod = modules.find(m => m.course_lessons.some(l => l.id === next.id));
      if (nextMod) router.push(`/learn/${courseSlug}/${nextMod.slug}/${next.slug}`);
    }
  }, [userId, currentLesson, modules, courseSlug]);

  const isCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false;
  const escalation = currentLesson?.escalation_level ? ESCALATION_STYLES[currentLesson.escalation_level] : null;
  const totalLessons = modules.flatMap(m => m.course_lessons).length;
  const completedCount = completedLessons.size;

  const isModuleUnlocked = useCallback((modId: string) => {
    if (isAdmin || enrolled) return true;
    const currentModIdx = modules.findIndex(m => m.id === modId);
    if (currentModIdx <= 0) return true;
    for (let i = 0; i < currentModIdx; i++) {
      const prevMod = modules[i];
      const allCompleted = prevMod.course_lessons.every(l => completedLessons.has(l.id));
      if (!allCompleted) return false;
    }
    return true;
  }, [modules, completedLessons, isAdmin, enrolled]);

  const currentMod = currentLesson ? modules.find(m => m.course_lessons.some(l => l.id === currentLesson.id)) : null;
  const currentLessonUnlocked = currentLesson
    ? (currentLesson.is_free_preview || isAdmin || (enrolled && currentMod && isModuleUnlocked(currentMod.id)))
    : false;

  const isLockedByEnrollment = currentLesson ? (!currentLesson.is_free_preview && !enrolled && !isAdmin) : false;

  const firstIncompleteMod = modules.find(mod => {
    const currentModIdx = modules.findIndex(m => m.id === mod.id);
    const targetModIdx = currentMod ? modules.findIndex(m => m.id === currentMod.id) : -1;
    if (currentModIdx >= targetModIdx) return false;
    return !mod.course_lessons.every(l => completedLessons.has(l.id));
  });
  const firstIncompleteLesson = firstIncompleteMod?.course_lessons.find(l => !completedLessons.has(l.id));

  return (
    <div className="min-h-screen bg-background text-foreground font-['Vilonti'] flex">

      {/* SIDEBAR */}
      <aside className={`fixed md:relative z-40 top-0 left-0 h-full md:h-auto w-72 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href={`/learn/${courseSlug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <span>←</span>
            <span className="text-sm font-medium">Courage Covenant™</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-3 border-b border-border bg-muted/10">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Your Progress</span>
            <span>{completedCount}/{totalLessons}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: totalLessons > 0 ? `${(completedCount / totalLessons) * 100}%` : "0%" }} />
          </div>
        </div>

        {/* Module/lesson tree */}
        <nav className="flex-1 overflow-y-auto py-2">
          {modules.map((mod) => {
            const isModUnlocked = isModuleUnlocked(mod.id);
            return (
              <div key={mod.id} className="mb-1">
                <div className="px-4 py-2 text-xs font-bold text-primary uppercase tracking-wide flex items-center justify-between">
                  <span>{mod.title}</span>
                  {!isModUnlocked && <Lock className="w-3 h-3 text-muted-foreground/50" />}
                </div>
                {mod.course_lessons.map((lesson) => {
                  const isActive = lesson.slug === lessonSlug;
                  const isDone = completedLessons.has(lesson.id);
                  const canAccess = lesson.is_free_preview || isAdmin || (enrolled && isModUnlocked);
                  return (
                    <div key={lesson.id}>
                      {canAccess ? (
                        <Link
                          href={`/learn/${courseSlug}/${mod.slug}/${lesson.slug}`}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive ? "bg-primary/10 text-foreground border-l-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                        >
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs ${isDone ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                            {isDone ? "✓" : ""}
                          </span>
                          <span className="flex-1 line-clamp-1">{lesson.title}</span>
                          <span className="text-xs text-primary">{lesson.duration_minutes}m</span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground/60 cursor-not-allowed">
                          <Lock className="flex-shrink-0 w-4 h-4 text-muted-foreground/45" />
                          <span className="flex-1 line-clamp-1">{lesson.title}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground p-1">☰</button>
          <p className="text-sm text-muted-foreground truncate">{currentLesson?.title}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAiPanel(!aiPanel)}
              className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-all"
            >
              ✨ AI Servant
            </button>
          </div>
        </div>

        {/* Lesson body */}
        <div className="flex-1 flex bg-background">
          <div className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
            {currentLesson ? (
              currentLessonUnlocked ? (
                <>
                  {/* Escalation badge */}
                  {escalation && (
                    <div className="mb-6 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: escalation.bg, border: `1px solid ${escalation.border}`, color: escalation.color }}>
                      {escalation.label}
                      {currentLesson.escalation_level === "red" && (
                        <p className="mt-1 text-xs font-normal opacity-80">If you are in an emergency situation, contact appropriate authorities immediately. Do not rely on this course.</p>
                      )}
                    </div>
                  )}

                  {/* Video embed */}
                  {currentLesson.video_url && (
                    <div className="mb-8 rounded-2xl overflow-hidden aspect-video bg-black shadow-card relative flex items-center justify-center group">
                      {currentLesson.video_url === 'placeholder' ? (
                        <div className="text-center p-6 text-white/50">
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <svg className="w-8 h-8 text-white/70 group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                          <p className="font-semibold text-lg">Lesson Video Placeholder</p>
                          <p className="text-sm opacity-70">The final video for "{currentLesson.title}" will be embedded here.</p>
                        </div>
                      ) : (
                        <iframe src={currentLesson.video_url} className="w-full h-full absolute inset-0" allow="autoplay; fullscreen" allowFullScreen />
                      )}
                    </div>
                  )}

                  <h1 className="text-3xl font-bold text-foreground mb-6">{currentLesson.title}</h1>
                  <div className="prose dark:prose-invert prose-purple max-w-none prose-p:leading-relaxed prose-p:mb-4">
                    <ReactMarkdown>
                      {currentLesson.content_body || ""}
                    </ReactMarkdown>
                  </div>

                  {/* Free preview upsell */}
                  {currentLesson.is_free_preview && !enrolled && (
                    <div className="mt-10 p-6 rounded-2xl border border-primary/40 bg-primary/5 text-center shadow-soft">
                      <p className="text-foreground font-semibold mb-2">You're viewing a free preview.</p>
                      <p className="text-muted-foreground text-sm mb-4">Enroll to access all 32 lessons, worksheets, scripts, and AI Servant integration.</p>
                      <Link href={`/learn/${courseSlug}#pricing`} className="inline-block px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all shadow-glow">
                        Enroll Now — from $97
                      </Link>
                    </div>
                  )}

                  {/* Complete button */}
                  {(enrolled || currentLesson.is_free_preview) && (
                    <div className="mt-10 pt-8 border-t border-border flex items-center justify-between">
                      <button
                        id="mark-complete-btn"
                        onClick={markComplete}
                        disabled={isCompleted || marking}
                        className={`px-6 py-3 rounded-full font-bold transition-all ${isCompleted ? "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 cursor-default" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"}`}
                      >
                        {isCompleted ? "✓ Completed" : marking ? "Saving..." : "Mark Complete & Continue →"}
                      </button>
                      <span className="text-xs text-primary">{currentLesson.duration_minutes} min lesson</span>
                    </div>
                  )}
                </>
              ) : isLockedByEnrollment ? (
                /* ENROLLMENT LOCK SCREEN */
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 shadow-glow">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3 font-['Vilonti']">Enroll to Unlock</h2>
                  <p className="text-muted-foreground max-w-md mb-8 text-sm">
                    This lesson is part of the premium Courage Covenant™ course. Enroll today to access all 32 lessons, worksheets, scripts, and AI Servant integration.
                  </p>
                  <Link 
                    href={`/learn/${courseSlug}#pricing`}
                    className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold transition-all shadow-glow"
                  >
                    Enroll Now — from $97
                  </Link>
                </div>
              ) : (
                /* SEQUENTIAL MODULE LOCK SCREEN */
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 shadow-glow">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3 font-['Vilonti']">Module Locked</h2>
                  <p className="text-muted-foreground max-w-md mb-8 text-sm">
                    To keep the learning experience structured and effective, you need to complete all previous modules before moving forward.
                  </p>
                  
                  {firstIncompleteMod && firstIncompleteLesson ? (
                    <div className="bg-card border border-border p-6 rounded-2xl max-w-md w-full shadow-soft mb-8">
                      <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">Next Step Needed</p>
                      <h4 className="font-semibold text-foreground mb-1 text-sm">Finish preceding module:</h4>
                      <p className="text-sm text-muted-foreground mb-4">{firstIncompleteMod.title}</p>
                      <Link 
                        href={`/learn/${courseSlug}/${firstIncompleteMod.slug}/${firstIncompleteLesson.slug}`}
                        className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-glow"
                      >
                        Resume Learning: {firstIncompleteLesson.title} →
                      </Link>
                    </div>
                  ) : (
                    <Link 
                      href={`/learn/${courseSlug}`}
                      className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-primary text-primary hover:bg-primary/10 text-sm font-semibold transition-all"
                    >
                      Go to Course Overview
                    </Link>
                  )}
                </div>
              )
            ) : (
              <div className="text-center text-primary py-20">Lesson not found.</div>
            )}
          </div>

          {/* AI SERVANT PANEL */}
          {aiPanel && (
            <aside className="w-80 border-l border-border bg-card flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-foreground">✨ AI Servant</p>
                <button onClick={() => setAiPanel(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              {currentLesson?.escalation_level === "red" && (
                <div className="mb-3 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
                  🔴 This lesson covers Red-level situations. If you or someone you know is in immediate danger, please contact emergency services. The AI Servant cannot provide crisis intervention.
                </div>
              )}
              <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                <p className="font-semibold text-foreground mb-1">Lesson Reflection Prompt:</p>
                <p>{currentLesson ? `You're on: "${currentLesson.title}". What emotion came up for you in this lesson?` : "What are you reflecting on today?"}</p>
              </div>
              <Link
                href={`/servant?context=courage-covenant&lesson=${currentLesson?.slug}`}
                className="mt-auto px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold text-center transition-all shadow-glow"
              >
                Open Full AI Servant →
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">The AI Servant is a reflection tool. It is not therapy or crisis support.</p>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
