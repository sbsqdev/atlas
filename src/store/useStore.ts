import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course, Exercise, Trainer, Workout } from '../types';
import { COURSES, TRAINERS } from '../data/seed';

const VERSION = 2;

interface DataState {
  trainers: Trainer[];
  courses: Course[];

  // course-level
  addCourse: (course: Course) => void;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // workout-level
  addWorkout: (courseId: string, workout: Workout) => void;
  updateWorkout: (courseId: string, workoutId: string, patch: Partial<Workout>) => void;
  deleteWorkout: (courseId: string, workoutId: string) => void;

  // exercise-level
  addExercise: (courseId: string, workoutId: string, exercise: Exercise) => void;
  updateExercise: (courseId: string, workoutId: string, exerciseId: string, patch: Partial<Exercise>) => void;
  deleteExercise: (courseId: string, workoutId: string, exerciseId: string) => void;

  reset: () => void;
}

function mapCourse(courses: Course[], id: string, fn: (c: Course) => Course): Course[] {
  return courses.map((c) => (c.id === id ? fn(c) : c));
}

export const useStore = create<DataState>()(
  persist(
    (set) => ({
      trainers: TRAINERS,
      courses: COURSES,

      addCourse: (course) => set((s) => ({ courses: [...s.courses, course] })),
      updateCourse: (id, patch) =>
        set((s) => ({ courses: mapCourse(s.courses, id, (c) => ({ ...c, ...patch })) })),
      deleteCourse: (id) => set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),

      addWorkout: (courseId, workout) =>
        set((s) => ({
          courses: mapCourse(s.courses, courseId, (c) => ({
            ...c,
            workouts: [...c.workouts, workout],
          })),
        })),
      updateWorkout: (courseId, workoutId, patch) =>
        set((s) => ({
          courses: mapCourse(s.courses, courseId, (c) => ({
            ...c,
            workouts: c.workouts.map((w) => (w.id === workoutId ? { ...w, ...patch } : w)),
          })),
        })),
      deleteWorkout: (courseId, workoutId) =>
        set((s) => ({
          courses: mapCourse(s.courses, courseId, (c) => ({
            ...c,
            workouts: c.workouts.filter((w) => w.id !== workoutId),
          })),
        })),

      addExercise: (courseId, workoutId, exercise) =>
        set((s) => ({
          courses: mapCourse(s.courses, courseId, (c) => ({
            ...c,
            workouts: c.workouts.map((w) =>
              w.id === workoutId ? { ...w, exercises: [...w.exercises, exercise] } : w,
            ),
          })),
        })),
      updateExercise: (courseId, workoutId, exerciseId, patch) =>
        set((s) => ({
          courses: mapCourse(s.courses, courseId, (c) => ({
            ...c,
            workouts: c.workouts.map((w) =>
              w.id === workoutId
                ? {
                    ...w,
                    exercises: w.exercises.map((e) =>
                      e.id === exerciseId ? { ...e, ...patch } : e,
                    ),
                  }
                : w,
            ),
          })),
        })),
      deleteExercise: (courseId, workoutId, exerciseId) =>
        set((s) => ({
          courses: mapCourse(s.courses, courseId, (c) => ({
            ...c,
            workouts: c.workouts.map((w) =>
              w.id === workoutId
                ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
                : w,
            ),
          })),
        })),

      reset: () => set({ trainers: TRAINERS, courses: COURSES }),
    }),
    {
      name: 'human-atlas-data',
      version: VERSION,
      // On a version bump, drop stale persisted content and fall back to seed.
      migrate: () => ({ trainers: TRAINERS, courses: COURSES }) as Partial<DataState>,
    },
  ),
);
