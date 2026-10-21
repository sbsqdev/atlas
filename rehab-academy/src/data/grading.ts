import type { AnswerValue, Question } from './types';

/** Deterministic grading shared by the test player, the API and the seed. */
export function gradeQuestion(q: Question, a: AnswerValue | undefined): number {
  if (a === undefined) return 0;
  switch (q.type) {
    case 'single':
    case 'identify':
    case 'case':
      return q.options?.find((o) => o.id === a)?.correct ? q.points : 0;
    case 'multi': {
      const want = new Set((q.options ?? []).filter((o) => o.correct).map((o) => o.id));
      const got = new Set(Array.isArray(a) ? a : []);
      return want.size === got.size && [...want].every((id) => got.has(id)) ? q.points : 0;
    }
    case 'match': {
      const pairs = q.pairs ?? [];
      const m = typeof a === 'object' && !Array.isArray(a) ? a : {};
      const ok = pairs.filter((p) => m[p.left] === p.right).length;
      return pairs.length ? (q.points * ok) / pairs.length : 0;
    }
    case 'sequence': {
      const seq = q.sequence ?? [];
      return Array.isArray(a) && a.length === seq.length && a.every((x, i) => x === seq[i]) ? q.points : 0;
    }
  }
}

export function isCorrect(q: Question, a: AnswerValue | undefined) {
  return gradeQuestion(q, a) >= q.points - 1e-9;
}

export function gradeAttempt(questions: Question[], answers: Record<string, AnswerValue>) {
  const total = questions.reduce((s, q) => s + q.points, 0);
  const got = questions.reduce((s, q) => s + gradeQuestion(q, answers[q.id]), 0);
  return total ? Math.round((got / total) * 100) : 0;
}

/** Correct answer in the shape the player stores answers in. */
export function correctAnswer(q: Question): AnswerValue {
  switch (q.type) {
    case 'multi': return (q.options ?? []).filter((o) => o.correct).map((o) => o.id);
    case 'match': return Object.fromEntries((q.pairs ?? []).map((p) => [p.left, p.right]));
    case 'sequence': return [...(q.sequence ?? [])];
    default: return q.options?.find((o) => o.correct)?.id ?? '';
  }
}
