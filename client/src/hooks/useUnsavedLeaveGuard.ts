"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

const GUARD_STATE_KEY = "__unsavedLeaveGuard";
/** Soft-nav / Strict Mode can leave extra same-URL history entries; cap back steps. */
const MAX_LEAVE_HISTORY_STEPS = 5;

function locationKey() {
  return window.location.pathname + window.location.search + window.location.hash;
}

function armGuardEntry() {
  const current = window.history.state;
  if (current && current[GUARD_STATE_KEY]) {
    return;
  }
  window.history.pushState(
    { ...(current && typeof current === "object" ? current : {}), [GUARD_STATE_KEY]: true },
    "",
    window.location.href,
  );
}

/** Walk back while URL is unchanged (past guard + soft-nav duplicates). */
function stepBackThroughSameLocation(maxSteps: number) {
  const start = locationKey();
  let steps = 0;

  const onLeavePop = () => {
    if (locationKey() !== start || steps >= maxSteps) {
      window.removeEventListener("popstate", onLeavePop);
      return;
    }
    steps += 1;
    window.history.back();
  };

  window.addEventListener("popstate", onLeavePop);
  steps += 1;
  window.history.back();
}

/**
 * Blocks leaving while `shouldBlock` is true.
 * In-app: call `requestLeave(action)`. Browser Back: popstate → modal → confirm/cancel.
 */
export function useUnsavedLeaveGuard(shouldBlock: boolean) {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const allowLeaveRef = useRef(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  function closeLeaveModal() {
    pendingActionRef.current = null;
    setIsLeaveModalOpen(false);
  }

  function confirmLeave() {
    const leave = pendingActionRef.current;
    pendingActionRef.current = null;
    allowLeaveRef.current = true;
    setIsLeaveModalOpen(false);
    leave?.();
  }

  function requestLeave(action: () => void) {
    if (!shouldBlock || allowLeaveRef.current) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setIsLeaveModalOpen(true);
  }

  const onPopState = useEffectEvent(() => {
    if (allowLeaveRef.current || !shouldBlock) {
      return;
    }
    // Re-arm so Cancel keeps the user on this page.
    // Stack is [..., previousPage, editor, guard]. Confirm must step past
    // the editor entry too (Strict Mode / soft-nav can add extras).
    armGuardEntry();
    pendingActionRef.current = () => {
      allowLeaveRef.current = true;
      stepBackThroughSameLocation(MAX_LEAVE_HISTORY_STEPS);
    };
    setIsLeaveModalOpen(true);
  });

  useEffect(() => {
    // Skip duplicate push on React Strict Mode remount (entry already armed).
    armGuardEntry();

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return { isLeaveModalOpen, requestLeave, confirmLeave, closeLeaveModal };
}
