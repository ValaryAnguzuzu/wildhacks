import { increment, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Check, ChevronLeft, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getLocalLesson, getLocalLessonsForCategory } from '@/content/lessons';
import {
  getSessionCount,
  markLessonComplete,
  patchUser,
  updateUser,
} from '@/firebase/firestore';
import { useStore } from '@/store/useStore';
import {
  calculateXP,
  checkStreakUpdate,
  mergeProgressAfterLessonComplete,
  shouldShowLifeReport,
  updateNetWorth,
} from '@/utils/gameLogic';

import { Button } from '../components/Button';

const emptyProgress = () => ({
  worldsUnlocked: 1,
  lessonsComplete: [] as string[],
  conceptsUnlocked: [] as string[],
  xpEarned: 0,
  perfectLessons: [] as string[],
});

export function Lesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const setProgress = useStore((s) => s.setProgress);
  const pushCelebration = useStore((s) => s.pushCelebration);

  const lesson = useMemo(
    () => (lessonId ? getLocalLesson(lessonId) : undefined),
    [lessonId],
  );
  const categoryId = lesson?.categoryId ?? user?.activeCategory ?? null;

  const [phase, setPhase] = useState<'concept' | 'quiz' | 'result'>('concept');
  const [choiceMade, setChoiceMade] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [retried, setRetried] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [showSheet, setShowSheet] = useState(false);

  const handleLessonComplete = useCallback(async () => {
    if (!user || !lesson || !categoryId) return;
    const duration = (Date.now() - startTime) / 1000;
    const lastPlayedDate =
      user.lastPlayed instanceof Timestamp ? user.lastPlayed.toDate() : null;
    const xp = calculateXP(Boolean(correct), !retried, user.streak);
    const prevNet = user.netWorth;
    const newNetWorth = updateNetWorth(prevNet, Boolean(correct));
    const perfect = Boolean(correct) && !retried;
    const netWorthDelta = newNetWorth - prevNet;

    const streakInfo = checkStreakUpdate(lastPlayedDate, user.streak);
    const prevProg = useStore.getState().progress[categoryId] ?? emptyProgress();
    const alreadyDone = prevProg.lessonsComplete?.includes(lesson.id) ?? false;

    const applyStreakFollowUps = async () => {
      if (!streakInfo.streakBroken) {
        await updateUser(user.uid, { recoverableStreak: null });
      }
      if (streakInfo.streakBroken && user.streakFreezes > 0) {
        const restoreTo = user.recoverableStreak ?? streakInfo.previousStreak;
        pushCelebration({ type: 'streakFreezeOffer', restoreTo });
      }
      if (streakInfo.newStreak > user.streak && streakInfo.newStreak % 7 === 0) {
        pushCelebration({ type: 'streakMilestone', days: streakInfo.newStreak });
      }
    };

    if (alreadyDone) {
      await patchUser(user.uid, {
        lastPlayed: serverTimestamp(),
        streak: streakInfo.newStreak,
      });
      setUser({
        ...user,
        lastPlayed: Timestamp.now(),
        streak: streakInfo.newStreak,
        recoverableStreak: streakInfo.streakBroken
          ? (user.recoverableStreak ?? null)
          : null,
      });
      await applyStreakFollowUps();
      const countRes = await getSessionCount(user.uid);
      navigate('/result', {
        state: {
          xp: 0,
          correct: Boolean(correct),
          perfect: false,
          lesson,
          practiceReplay: true,
          lifeReportAvailable: shouldShowLifeReport(countRes.data),
        },
      });
      return;
    }

    const mark = await markLessonComplete(
      user.uid,
      categoryId,
      lesson.id,
      {
        perfect,
        xpEarned: xp,
        conceptTag: lesson.scenario.conceptTag,
      },
      {
        result: Boolean(correct),
        correctOnFirst: !retried && Boolean(correct),
        durationSeconds: duration,
        netWorthDelta,
      },
    );

    let worldUnlocked = false;
    let newWorldNumber: number | null = null;

    if (mark.error || !mark.data) {
      const allLessons = getLocalLessonsForCategory(categoryId);
      const merged = mergeProgressAfterLessonComplete(
        prevProg,
        lesson.id,
        {
          perfect,
          xpEarned: xp,
          conceptTag: lesson.scenario.conceptTag,
        },
        allLessons,
      );
      setProgress(categoryId, merged.progress);
      worldUnlocked = merged.worldUnlocked;
      newWorldNumber = merged.newWorldNumber;
      await patchUser(user.uid, {
        xp: increment(xp),
        netWorth: newNetWorth,
        lastPlayed: serverTimestamp(),
        streak: streakInfo.newStreak,
      }).catch(() => {});
    } else {
      setProgress(categoryId, mark.data.progress);
      worldUnlocked = mark.data.worldUnlocked;
      newWorldNumber = mark.data.newWorldNumber;
      await patchUser(user.uid, {
        xp: increment(xp),
        netWorth: newNetWorth,
        lastPlayed: serverTimestamp(),
        streak: streakInfo.newStreak,
      });
    }

    setUser({
      ...user,
      xp: user.xp + xp,
      netWorth: newNetWorth,
      lastPlayed: Timestamp.now(),
      streak: streakInfo.newStreak,
      recoverableStreak: streakInfo.streakBroken
        ? (user.recoverableStreak ?? null)
        : null,
    });

    await applyStreakFollowUps();

    if (worldUnlocked && newWorldNumber) {
      pushCelebration({
        type: 'worldComplete',
        world: newWorldNumber,
        categoryId,
      });
    }

    const countRes = await getSessionCount(user.uid);
    navigate('/result', {
      state: {
        xp,
        correct: Boolean(correct),
        perfect,
        lesson,
        syncIssue: Boolean(mark.error || !mark.data),
        lifeReportAvailable: shouldShowLifeReport(countRes.data),
      },
    });
  }, [
    user,
    lesson,
    categoryId,
    startTime,
    correct,
    retried,
    setUser,
    setProgress,
    pushCelebration,
    navigate,
  ]);

  if (!lesson || !lessonId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--background)]">
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Something went wrong
        </p>
        <Button onClick={() => navigate('/home')}>Try again</Button>
      </div>
    );
  }

  const progressPct = phase === 'concept' ? 40 : phase === 'quiz' ? 70 : 100;
  const worldLabel = `World ${lesson.world}`;

  const onChoose = async (id: string) => {
    if (choiceMade !== null) return;
    const isCorrect = id === lesson.scenario.correct;
    setChoiceMade(id);
    setCorrect(isCorrect);
    setShowSheet(true);
    if (!isCorrect && user) {
      setRetried(true);
    }
    if (isCorrect && user) {
      const el = document.getElementById(`choice-${id}`);
      let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      if (el) {
        const r = el.getBoundingClientRect();
        pos = { x: r.left + r.width / 2, y: r.top };
      }
      const xpAmt = calculateXP(true, !retried, user.streak);
      if (xpAmt > 0) {
        pushCelebration({ type: 'xpFloat', amount: xpAmt, position: pos });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:items-center md:pt-8 md:pb-16 bg-[var(--background)]">
      <div className="w-full md:max-w-3xl md:px-6">
        <div className="sticky top-0 z-10 md:relative md:top-auto bg-[var(--background)]">
          <div className="flex items-center justify-between px-6 md:px-0 py-4">
            <button type="button" onClick={() => navigate(-1)} aria-label="Back">
              <ChevronLeft size={24} style={{ color: 'var(--text-primary)' }} />
            </button>
            <div className="flex-1 mx-4">
              <div className="h-1.5 rounded-full overflow-hidden bg-[var(--border-subtle)]">
                <motion.div
                  className="h-full bg-[var(--teal)]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <div
              className="font-semibold text-[var(--xp-gold)]"
              style={{ fontSize: 'var(--font-body)' }}
            />
          </div>
        </div>

        <div className="flex-1 px-6 md:px-0 py-8">
          <AnimatePresence mode="wait">
            {phase === 'concept' && (
              <motion.div
                key="concept"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
                className="h-full flex flex-col"
              >
                <div
                  className="flex-1 p-6 md:p-8 rounded-[var(--radius-card)] mb-6 border border-[var(--border-subtle)] bg-[var(--surface)]"
                  style={{ borderTopWidth: 4, borderTopColor: 'var(--teal)' }}
                >
                  <div
                    className="mb-2 uppercase tracking-wide font-medium"
                    style={{ fontSize: 'var(--font-micro)', color: 'var(--text-muted)' }}
                  >
                    {worldLabel} · Lesson
                  </div>
                  <h2
                    className="mb-6"
                    style={{
                      fontSize: 'var(--font-subheading)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {lesson.title}
                  </h2>
                  <div
                    className="mb-6 whitespace-pre-line leading-relaxed"
                    style={{
                      fontSize: 'var(--font-body)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {lesson.concept}
                  </div>
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--teal) 15%, transparent)',
                      borderLeft: '3px solid var(--teal)',
                    }}
                  >
                    <div
                      className="font-semibold"
                      style={{ fontSize: 'var(--font-body)', color: 'var(--teal)' }}
                    >
                      {lesson.takeaway}
                    </div>
                  </div>
                </div>
                <Button fullWidth onClick={() => setPhase('quiz')}>
                  Got it — test me
                </Button>
              </motion.div>
            )}

            {phase === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
                className="h-full flex flex-col pb-40"
              >
                <div className="flex-1 p-6 md:p-8 rounded-[var(--radius-card)] mb-6 border border-[var(--border-subtle)] bg-[var(--surface)]">
                  <div
                    className="inline-block px-3 py-1 rounded-[var(--radius-pill)] mb-4 text-xs uppercase tracking-wide font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--teal) 20%, transparent)',
                      color: 'var(--teal)',
                    }}
                  >
                    Scenario
                  </div>
                  <p
                    className="mb-6 leading-relaxed"
                    style={{ fontSize: 'var(--font-body)', color: 'var(--text-primary)' }}
                  >
                    {lesson.scenario.situation}
                  </p>
                  <div className="space-y-3">
                    {lesson.scenario.choices.map((choice) => {
                      const selected = choiceMade === choice.id;
                      const isCorrectChoice = choice.id === lesson.scenario.correct;
                      const show = choiceMade !== null;
                      const faded = show && !selected && !isCorrectChoice;

                      return (
                        <motion.button
                          key={choice.id}
                          id={`choice-${choice.id}`}
                          type="button"
                          onClick={() => void onChoose(choice.id)}
                          disabled={show}
                          whileTap={!show ? { scale: 0.98 } : {}}
                          className="w-full p-4 rounded-[var(--radius-button)] text-left border-2 transition-all relative bg-[var(--surface-elevated)]"
                          style={{
                            borderColor: show
                              ? isCorrectChoice
                                ? 'var(--correct)'
                                : selected
                                  ? 'var(--wrong)'
                                  : 'var(--border-subtle)'
                              : 'var(--border-subtle)',
                            backgroundColor: show
                              ? isCorrectChoice
                                ? 'color-mix(in srgb, var(--correct) 15%, transparent)'
                                : selected
                                  ? 'color-mix(in srgb, var(--wrong) 15%, transparent)'
                                  : 'var(--surface-elevated)'
                              : 'var(--surface-elevated)',
                            opacity: faded ? 0.4 : 1,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              style={{
                                fontSize: 'var(--font-body)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {choice.text}
                            </span>
                            {show && isCorrectChoice && (
                              <div className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-[var(--correct)] flex items-center justify-center">
                                <Check size={14} color="white" />
                              </div>
                            )}
                            {show && selected && !isCorrectChoice && (
                              <div className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-[var(--wrong)] flex items-center justify-center">
                                <X size={14} color="white" />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence>
                  {showSheet && choiceMade !== null && (
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                      className="fixed bottom-0 left-0 right-0 p-6 rounded-t-[var(--radius-card)] max-h-[50vh] overflow-y-auto border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
                    >
                      <div className="text-center mb-4">
                        {correct ? (
                          <>
                            <div className="text-5xl mb-2">✓</div>
                            <div
                              className="font-bold mb-2 text-[var(--correct)]"
                              style={{ fontSize: 'var(--font-heading)' }}
                            >
                              Correct!
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-5xl mb-2">✗</div>
                            <div
                              className="font-bold mb-2 text-[var(--wrong)]"
                              style={{ fontSize: 'var(--font-heading)' }}
                            >
                              Not quite
                            </div>
                          </>
                        )}
                      </div>
                      <p
                        className="mb-4 leading-relaxed"
                        style={{
                          fontSize: 'var(--font-body)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {lesson.scenario.feedback[choiceMade] ?? lesson.scenario.lesson}
                      </p>
                      {correct && (
                        <motion.div
                          className="text-center mb-4 font-bold text-2xl text-[var(--xp-gold)]"
                          initial={{ y: 8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                        >
                          +{calculateXP(true, !retried, user?.streak ?? 0)} XP
                        </motion.div>
                      )}
                      <Button
                        fullWidth
                        onClick={() => {
                          void handleLessonComplete();
                        }}
                      >
                        Continue
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
