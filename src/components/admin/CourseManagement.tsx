import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, PlayCircle, BookOpen, LockOpen, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  duration_minutes: number;
  is_free_preview: boolean;
  escalation_level: string | null;
  order_index: number;
}

interface Module {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  course_lessons: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  title: string;
  course_modules: Module[];
}

export function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id, slug, title,
        course_modules (
          id, slug, title, order_index,
          course_lessons (
            id, slug, title, duration_minutes, is_free_preview, escalation_level, order_index
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching curriculum:", error);
    } else if (data) {
      // Sort modules and lessons
      const sorted = data.map((c: any) => ({
        ...c,
        course_modules: [...c.course_modules].sort((a, b) => a.order_index - b.order_index).map((m: any) => ({
          ...m,
          course_lessons: [...m.course_lessons].sort((a, b) => a.order_index - b.order_index)
        }))
      }));
      setCourses(sorted);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading curriculum...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 text-center border rounded-xl bg-card">
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No courses found in the database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {courses.map(course => (
        <div key={course.id} className="border rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">{course.title}</h3>
              <p className="text-sm text-muted-foreground">{course.course_modules.length} Modules</p>
            </div>
            <Link href={`/learn/${course.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" /> View Sales Page
              </Button>
            </Link>
          </div>

          <div className="p-4">
            <Accordion type="multiple" defaultValue={course.course_modules.map(m => m.id)} className="w-full space-y-3">
              {course.course_modules.map((mod, i) => (
                <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg px-4 bg-background">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left w-full">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-base">{mod.title}</span>
                      <span className="text-xs font-normal text-muted-foreground ml-auto pr-4">
                        {mod.course_lessons.length} lessons
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-2 mt-2">
                      {mod.course_lessons.map((lesson, j) => (
                        <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-4 text-right">{j + 1}.</span>
                            <span className="text-sm font-medium">{lesson.title}</span>
                            
                            <div className="flex items-center gap-2 ml-2 flex-wrap">
                              {lesson.is_free_preview && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                  <LockOpen className="w-3 h-3" /> Free Preview
                                </span>
                              )}
                              {lesson.escalation_level && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  lesson.escalation_level === 'green' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                  lesson.escalation_level === 'yellow' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                  'bg-red-500/10 text-red-600 border-red-500/20'
                                }`}>
                                  <ShieldAlert className="w-3 h-3" /> {lesson.escalation_level.toUpperCase()}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {lesson.duration_minutes} min
                              </span>
                            </div>
                          </div>
                          <Link href={`/learn/${course.slug}/${mod.slug}/${lesson.slug}`} target="_blank" className="shrink-0">
                            <Button variant="secondary" size="sm" className="gap-2 h-8 w-full sm:w-auto hover:bg-primary hover:text-primary-foreground transition-colors">
                              <PlayCircle className="w-4 h-4" /> Preview Lesson
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      ))}
    </div>
  );
}
