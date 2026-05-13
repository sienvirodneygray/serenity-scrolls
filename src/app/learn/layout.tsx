import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Courage Covenant™ Courses | Serenity Scrolls',
  description: 'Scripture-based bullying guidance courses for parents, students, and faith leaders. Learn to respond with clarity, courage, and wisdom.',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
