import 'server-only';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  getDb, newId, siteCourses, siteLessons, siteLessonProgress, siteUsers,
  type SiteCourse, type SiteLesson,
} from '@/lib/db';
import { notifyMember } from '@/lib/site-membership';

// Structured learning for a tenant site: courses → ordered lessons → per-member
// progress. Every function is siteId-scoped (tenant isolation). Admin CRUD is
// called from /api/site-members (ownership already enforced by requireSiteOwner);
// member reads are called from /api/site-auth after the approved-member gate.

// ── Admin: courses ──────────────────────────────────────────────────────────

export interface AdminCourse extends SiteCourse {
  lessonCount: number;
}

/** Lesson counts keyed by courseId for a site (one grouped query). */
function lessonCounts(siteId: string): Record<string, number> {
  const rows = getDb()
    .select({ courseId: siteLessons.courseId, n: sql<number>`count(*)` })
    .from(siteLessons)
    .where(eq(siteLessons.siteId, siteId))
    .groupBy(siteLessons.courseId)
    .all();
  const out: Record<string, number> = {};
  for (const r of rows) out[r.courseId] = r.n;
  return out;
}

export function listCoursesForAdmin(siteId: string): AdminCourse[] {
  const counts = lessonCounts(siteId);
  return getDb()
    .select()
    .from(siteCourses)
    .where(eq(siteCourses.siteId, siteId))
    .orderBy(asc(siteCourses.position), desc(siteCourses.createdAt))
    .all()
    .map((c) => ({ ...c, lessonCount: counts[c.id] ?? 0 }));
}

export function createCourse(
  siteId: string,
  adminUserId: string,
  data: { title?: string; description?: string; accent?: string; published?: boolean },
): SiteCourse {
  const now = new Date();
  const maxPos = getDb()
    .select({ m: sql<number>`coalesce(max(${siteCourses.position}), -1)` })
    .from(siteCourses)
    .where(eq(siteCourses.siteId, siteId))
    .get();
  const row: SiteCourse = {
    id: newId('crs'),
    siteId,
    title: (data.title ?? '').slice(0, 200),
    description: (data.description ?? '').slice(0, 2000),
    accent: (data.accent ?? '').slice(0, 40),
    position: (maxPos?.m ?? -1) + 1,
    published: data.published ?? true,
    createdBy: adminUserId,
    createdAt: now,
    updatedAt: now,
  };
  getDb().insert(siteCourses).values(row).run();
  if (row.published) notifyCourse(siteId, row.title);
  return row;
}

export function updateCourse(
  siteId: string,
  courseId: string,
  data: { title?: string; description?: string; accent?: string; published?: boolean },
): void {
  const prev = getDb().select().from(siteCourses).where(and(eq(siteCourses.id, courseId), eq(siteCourses.siteId, siteId))).get();
  if (!prev) return;
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof data.title === 'string') set.title = data.title.slice(0, 200);
  if (typeof data.description === 'string') set.description = data.description.slice(0, 2000);
  if (typeof data.accent === 'string') set.accent = data.accent.slice(0, 40);
  if (typeof data.published === 'boolean') set.published = data.published;
  getDb().update(siteCourses).set(set).where(and(eq(siteCourses.id, courseId), eq(siteCourses.siteId, siteId))).run();
  // Notify only on a draft → published transition.
  if (data.published === true && !prev.published) {
    notifyCourse(siteId, typeof set.title === 'string' ? (set.title as string) : prev.title);
  }
}

export function deleteCourse(siteId: string, courseId: string): void {
  // Lessons + progress cascade via FK.
  getDb().delete(siteCourses).where(and(eq(siteCourses.id, courseId), eq(siteCourses.siteId, siteId))).run();
}

/** Tell approved members a new course is available. Best-effort fan-out. */
function notifyCourse(siteId: string, title: string): void {
  const members = getDb().select({ id: siteUsers.id }).from(siteUsers).where(and(eq(siteUsers.siteId, siteId), eq(siteUsers.status, 'approved'))).all();
  for (const m of members) notifyMember(siteId, m.id, 'course', 'Новый курс', title || 'Опубликован новый курс для обучения.');
}

// ── Admin: lessons ───────────────────────────────────────────────────────────

/** Confirm a course belongs to the site (guards lesson writes). */
function courseInSite(siteId: string, courseId: string): boolean {
  return !!getDb().select({ id: siteCourses.id }).from(siteCourses).where(and(eq(siteCourses.id, courseId), eq(siteCourses.siteId, siteId))).get();
}

export function listLessonsForAdmin(siteId: string, courseId: string): SiteLesson[] {
  return getDb()
    .select()
    .from(siteLessons)
    .where(and(eq(siteLessons.siteId, siteId), eq(siteLessons.courseId, courseId)))
    .orderBy(asc(siteLessons.position), asc(siteLessons.createdAt))
    .all();
}

export function createLesson(
  siteId: string,
  courseId: string,
  data: { title?: string; body?: string; videoUrl?: string; attachmentUrl?: string },
): SiteLesson | null {
  if (!courseInSite(siteId, courseId)) return null;
  const now = new Date();
  const maxPos = getDb()
    .select({ m: sql<number>`coalesce(max(${siteLessons.position}), -1)` })
    .from(siteLessons)
    .where(eq(siteLessons.courseId, courseId))
    .get();
  const row: SiteLesson = {
    id: newId('lsn'),
    courseId,
    siteId,
    title: (data.title ?? '').slice(0, 200),
    body: (data.body ?? '').slice(0, 40000),
    videoUrl: (data.videoUrl ?? '').slice(0, 1000),
    attachmentUrl: (data.attachmentUrl ?? '').slice(0, 1000),
    position: (maxPos?.m ?? -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  getDb().insert(siteLessons).values(row).run();
  return row;
}

export function updateLesson(
  siteId: string,
  lessonId: string,
  data: { title?: string; body?: string; videoUrl?: string; attachmentUrl?: string },
): void {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof data.title === 'string') set.title = data.title.slice(0, 200);
  if (typeof data.body === 'string') set.body = data.body.slice(0, 40000);
  if (typeof data.videoUrl === 'string') set.videoUrl = data.videoUrl.slice(0, 1000);
  if (typeof data.attachmentUrl === 'string') set.attachmentUrl = data.attachmentUrl.slice(0, 1000);
  getDb().update(siteLessons).set(set).where(and(eq(siteLessons.id, lessonId), eq(siteLessons.siteId, siteId))).run();
}

export function deleteLesson(siteId: string, lessonId: string): void {
  getDb().delete(siteLessons).where(and(eq(siteLessons.id, lessonId), eq(siteLessons.siteId, siteId))).run();
}

// ── Member: read + progress ───────────────────────────────────────────────────

export interface MemberCourse {
  id: string;
  title: string;
  description: string;
  accent: string;
  lessonCount: number;
  completedCount: number;
  createdAt: Date;
}

/** Published courses of a site with the member's progress. Call ONLY after the
 *  approved-member gate (see /api/site-auth resource=courses). */
export function listPublishedCourses(siteId: string, siteUserId: string): MemberCourse[] {
  const courses = getDb()
    .select()
    .from(siteCourses)
    .where(and(eq(siteCourses.siteId, siteId), eq(siteCourses.published, true)))
    .orderBy(asc(siteCourses.position), desc(siteCourses.createdAt))
    .all();
  if (courses.length === 0) return [];
  const ids = courses.map((c) => c.id);
  const total = getDb()
    .select({ courseId: siteLessons.courseId, n: sql<number>`count(*)` })
    .from(siteLessons)
    .where(inArray(siteLessons.courseId, ids))
    .groupBy(siteLessons.courseId)
    .all();
  const done = getDb()
    .select({ courseId: siteLessons.courseId, n: sql<number>`count(*)` })
    .from(siteLessonProgress)
    .innerJoin(siteLessons, eq(siteLessonProgress.lessonId, siteLessons.id))
    .where(and(eq(siteLessonProgress.siteUserId, siteUserId), inArray(siteLessons.courseId, ids)))
    .groupBy(siteLessons.courseId)
    .all();
  const totalMap: Record<string, number> = {};
  for (const r of total) totalMap[r.courseId] = r.n;
  const doneMap: Record<string, number> = {};
  for (const r of done) doneMap[r.courseId] = r.n;
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    accent: c.accent,
    lessonCount: totalMap[c.id] ?? 0,
    completedCount: doneMap[c.id] ?? 0,
    createdAt: c.createdAt,
  }));
}

export interface MemberLesson {
  id: string;
  title: string;
  body: string;
  videoUrl: string;
  attachmentUrl: string;
  completed: boolean;
}
export interface MemberCourseDetail {
  id: string;
  title: string;
  description: string;
  accent: string;
  lessons: MemberLesson[];
}

/** A single published course with its lessons + this member's completion. */
export function getCourseForMember(siteId: string, siteUserId: string, courseId: string): MemberCourseDetail | null {
  const course = getDb()
    .select()
    .from(siteCourses)
    .where(and(eq(siteCourses.id, courseId), eq(siteCourses.siteId, siteId), eq(siteCourses.published, true)))
    .get();
  if (!course) return null;
  const lessons = getDb()
    .select()
    .from(siteLessons)
    .where(and(eq(siteLessons.courseId, courseId), eq(siteLessons.siteId, siteId)))
    .orderBy(asc(siteLessons.position), asc(siteLessons.createdAt))
    .all();
  const doneRows = getDb()
    .select({ lessonId: siteLessonProgress.lessonId })
    .from(siteLessonProgress)
    .where(and(eq(siteLessonProgress.siteUserId, siteUserId), eq(siteLessonProgress.siteId, siteId)))
    .all();
  const done = new Set(doneRows.map((r) => r.lessonId));
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    accent: course.accent,
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      body: l.body,
      videoUrl: l.videoUrl,
      attachmentUrl: l.attachmentUrl,
      completed: done.has(l.id),
    })),
  };
}

/** Mark a lesson complete/incomplete for a member. Verifies the lesson belongs
 *  to this site and its course is published (no writing progress on drafts). */
export function setLessonProgress(siteId: string, siteUserId: string, lessonId: string, done: boolean): boolean {
  const lesson = getDb()
    .select({ id: siteLessons.id, courseId: siteLessons.courseId })
    .from(siteLessons)
    .where(and(eq(siteLessons.id, lessonId), eq(siteLessons.siteId, siteId)))
    .get();
  if (!lesson) return false;
  const published = getDb()
    .select({ id: siteCourses.id })
    .from(siteCourses)
    .where(and(eq(siteCourses.id, lesson.courseId), eq(siteCourses.published, true)))
    .get();
  if (!published) return false;
  const db = getDb();
  if (done) {
    const exists = db
      .select({ id: siteLessonProgress.id })
      .from(siteLessonProgress)
      .where(and(eq(siteLessonProgress.siteUserId, siteUserId), eq(siteLessonProgress.lessonId, lessonId)))
      .get();
    if (!exists) {
      db.insert(siteLessonProgress).values({ id: newId('prg'), siteUserId, lessonId, siteId, completedAt: new Date() }).run();
    }
  } else {
    db.delete(siteLessonProgress).where(and(eq(siteLessonProgress.siteUserId, siteUserId), eq(siteLessonProgress.lessonId, lessonId))).run();
  }
  return true;
}

/** Count of published courses (for the cabinet overview stat). */
export function countPublishedCourses(siteId: string): number {
  const row = getDb()
    .select({ n: sql<number>`count(*)` })
    .from(siteCourses)
    .where(and(eq(siteCourses.siteId, siteId), eq(siteCourses.published, true)))
    .get();
  return row?.n ?? 0;
}
