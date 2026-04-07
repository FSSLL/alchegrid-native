import React, { createContext, useContext } from "react";
import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import Constants from "expo-constants";

const REVENUECAT_TEST_API_KEY   = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY   ?? "";
const REVENUECAT_IOS_API_KEY    = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY    ?? "";
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";

export const COIN_ENTITLEMENT_IDENTIFIER = "coins";

// Coin amounts awarded per package identifier
export const COINS_PER_PACKAGE: Record<string, number> = {
  "$rc_custom_small":  100,
  "$rc_custom_medium": 600,
  "$rc_custom_large":  1500,
};

function getRevenueCatApiKey(): string {
  if (!REVENUECAT_TEST_API_KEY || !REVENUECAT_IOS_API_KEY || !REVENUECAT_ANDROID_API_KEY) {
    throw new Error("RevenueCat API keys not configured");
  }
  // Use test store in Expo Go, dev mode, or web
  if (
    __DEV__ ||
    Platform.OS === "web" ||
    (Constants as any).executionEnvironment === "storeClient"
  ) {
    return REVENUECAT_TEST_API_KEY;
  }
  if (Platform.OS === "ios")     return REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android") return REVENUECAT_ANDROID_API_KEY;
  return REVENUECAT_TEST_API_KEY;
}

export function initializeRevenueCat() {
  const apiKey = getRevenueCatApiKey();
  Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
}

// ── Context / hook ────────────────────────────────────────────────────────────

interface SubscriptionCtx {
  packages: PurchasesPackage[];
  isLoading: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  isPurchasing: boolean;
  isRestoring: boolean;
}

const Context = createContext<SubscriptionCtx | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [packages, setPackages] = React.useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    Purchases.getOfferings()
      .then((offerings) => {
        if (!cancelled) {
          setPackages(offerings.current?.availablePackages ?? []);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const purchasePackage = React.useCallback(async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    try {
      await Purchases.purchasePackage(pkg);
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restorePurchases = React.useCallback(async () => {
    setIsRestoring(true);
    try {
      await Purchases.restorePurchases();
    } finally {
      setIsRestoring(false);
    }
  }, []);

  return (
    <Context.Provider value={{ packages, isLoading, purchasePackage, restorePurchases, isPurchasing, isRestoring }}>
      {children}
    </Context.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return ctx;
}
