"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

// SSR-safe "has this component mounted on the client yet" check, without
// setState-in-effect (React recommends useSyncExternalStore for this).
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
