import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
  Animated,
  Easing,
  RefreshControl,
} from "react-native";

import {
  CreditCard,
  Users2,
  Bell,
  HandCoins,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
  Menu,
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";

import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";

import ProfileSidebar from "../../components/ProfileSidebar";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../config/supabase";

/* =========================================================
   DEFAULT AVATAR
========================================================= */

const DEFAULT_AVATAR =
  "https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg";

const TOTAL_BALANCE = 45678.9;

/* =========================================================
   HELPERS
========================================================= */

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatMoney(value) {
  const [whole, decimals] = value.toFixed(2).split(".");

  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimals}`;
}

/* =========================================================
   FADE IN VIEW
========================================================= */

function FadeInView({ delay = 0, style, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* =========================================================
   SCALE PRESSABLE
========================================================= */

function ScalePressable({ style, onPress, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  function animateTo(value) {
    Animated.spring(scale, {
      toValue: value,
      friction: 6,
      tension: 220,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* =========================================================
   BELL BUTTON
========================================================= */

function BellButton() {
  const rotate = useRef(new Animated.Value(0)).current;

  function wiggle() {
    Animated.sequence([
      Animated.timing(rotate, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: -1,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }

  useEffect(() => {
    const timer = setTimeout(wiggle, 900);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-14deg", "14deg"],
  });

  return (
    <Pressable style={styles.notification} onPress={wiggle}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Bell size={20} strokeWidth={2} color={colors.text} />
      </Animated.View>
    </Pressable>
  );
}

/* =========================================================
   FLOATING CIRCLE
========================================================= */

function FloatingCircle({ style, distance = 8, duration = 3200 }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, []);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -distance],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[style, { transform: [{ translateY }] }]}
    />
  );
}

/* =========================================================
   BALANCE AMOUNT
========================================================= */

function BalanceAmount({ value, hidden }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = progress.addListener(({ value: current }) => {
      setDisplay(current);
    });

    Animated.timing(progress, {
      toValue: value,
      duration: 1400,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => progress.removeListener(id);
  }, [value]);

  return (
    <Text style={styles.balance}>
      {hidden ? "R ••••••" : `R${formatMoney(display)}`}
    </Text>
  );
}

/* =========================================================
   PULSE DOT
========================================================= */

function PulseDot({ color, pulse }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!pulse) {
      return undefined;
    }

    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.pulseWrap}>
      {pulse && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              backgroundColor: color,
              opacity,
              transform: [{ scale }],
            },
          ]}
        />
      )}

      <View style={[styles.pulseCore, { backgroundColor: color }]} />
    </View>
  );
}

/* =========================================================
   SKELETON CARD
========================================================= */

function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[styles.stokvelCard, { opacity: pulse }]}>
      <View style={styles.stokvelTop}>
        <View style={styles.stokvelTitleArea}>
          <View style={[styles.skeletonBar, { width: "60%", height: 14 }]} />
          <View
            style={[
              styles.skeletonBar,
              { width: "35%", height: 10, marginTop: 8 },
            ]}
          />
        </View>

        <View
          style={[
            styles.skeletonBar,
            { width: 72, height: 20, borderRadius: 10 },
          ]}
        />
      </View>

      <View style={styles.stokvelDivider} />

      <View style={styles.stokvelBottom}>
        <View style={styles.stokvelInfo}>
          <View style={[styles.skeletonBar, { width: 50, height: 8 }]} />
          <View
            style={[
              styles.skeletonBar,
              { width: 62, height: 12, marginTop: 6 },
            ]}
          />
        </View>

        <View style={styles.stokvelInfo}>
          <View style={[styles.skeletonBar, { width: 50, height: 8 }]} />
          <View
            style={[
              styles.skeletonBar,
              { width: 78, height: 12, marginTop: 6 },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

function QuickAddButton({ onPress }) {
  const pop = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 140,
      delay: 400,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );

    loop.start();

    return () => loop.stop();
  }, []);

  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7],
  });

  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });

  function animatePress(value) {
    Animated.spring(press, {
      toValue: value,
      friction: 6,
      tension: 220,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View
      style={[
        styles.fabWrap,
        {
          opacity: pop,
          transform: [{ scale: Animated.multiply(pop, press) }],
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fabRing,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      <Pressable
        style={styles.fab}
        onPress={onPress}
        onPressIn={() => animatePress(0.9)}
        onPressOut={() => animatePress(1)}
        accessibilityRole="button"
        accessibilityLabel="Create or join a stokvel"
      >
        <Plus size={26} strokeWidth={2.5} color={colors.white} />
      </Pressable>
    </Animated.View>
  );
}

/* =========================================================
   AVATAR STACK
========================================================= */

function AvatarStack({ members = [] }) {
  const visibleMembers = members.slice(0, 3);
  const extraMembers = Math.max(members.length - 3, 0);

  if (!members.length) {
    return null;
  }

  return (
    <View style={styles.avatarStack}>
      {visibleMembers.map((member, index) => (
        <View
          key={member.user_id || index}
          style={[
            styles.avatarWrapper,
            {
              marginLeft: index === 0 ? 0 : -9,
              zIndex: visibleMembers.length - index,
            },
          ]}
        >
          {member.profile_image_url ? (
            <Image
              source={{
                uri: member.profile_image_url,
              }}
              style={styles.stackedAvatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {member.full_name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
        </View>
      ))}

      {extraMembers > 0 && (
        <View
          style={[
            styles.avatarWrapper,
            styles.extraAvatar,
            {
              marginLeft: -9,
              zIndex: 0,
            },
          ]}
        >
          <Text style={styles.extraAvatarText}>+{extraMembers}</Text>
        </View>
      )}
    </View>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const contributed = status === "contributed";

  return (
    <View
      style={[
        styles.statusBadge,
        contributed ? styles.statusBadgeContributed : styles.statusBadgeDue,
      ]}
    >
      <PulseDot
        color={contributed ? "#127A4F" : "#E23434"}
        pulse={!contributed}
      />

      <Text
        style={[
          styles.statusText,
          contributed ? styles.statusTextContributed : styles.statusTextDue,
        ]}
      >
        {contributed ? "CONTRIBUTED" : "DUE"}
      </Text>
    </View>
  );
}

/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen() {
  const navigation = useNavigation();

  const [sidebarVisible, setSidebarVisible] = useState(false);

  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [stokvels, setStokvels] = useState([]);
  const [stokvelsLoading, setStokvelsLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [balanceHidden, setBalanceHidden] = useState(false);

  function onRefresh() {
    setRefreshing(true);
    setRefreshKey((key) => key + 1);
  }

  /* =====================================================
       LOAD PROFILE
    ===================================================== */

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Profile error:", error.message);

        setProfileLoading(false);
        return;
      }

      setProfile(data);
      setProfileLoading(false);
    }

    if (!authLoading) {
      loadProfile();
    }
  }, [user, authLoading, refreshKey]);

  /* =====================================================
       LOAD STOKVELS
    ===================================================== */

  useEffect(() => {
    async function loadStokvels() {
      if (!user) {
        setStokvelsLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        /* -----------------------------------------
                   GET USER STOKVEL MEMBERSHIPS
                ----------------------------------------- */

        const { data, error } = await supabase
          .from("stokvel_members")
          .select(
            `
                        stokvel_id,
                        stokvels (
                            id,
                            name,
                            description,
                            contribution_amount,
                            contribution_frequency,
                            max_members,
                            creator_id,
                            status
                        )
                    `,
          )
          .eq("user_id", user.id)
          .eq("status", "active");

        if (error) {
          console.log("Stokvel error:", error.message);

          setStokvelsLoading(false);
          setRefreshing(false);
          return;
        }

        const memberships = (data || []).filter((item) => item.stokvels);

        /* -----------------------------------------
                   LOAD EXTRA INFORMATION FOR EACH STOKVEL
                ----------------------------------------- */

        const enrichedStokvels = await Promise.all(
          memberships.map(async (membership) => {
            const stokvel = membership.stokvels;

            /* =========================
                                   MEMBERS + AVATARS
                                ========================= */

            let members = [];

            const { data: memberData, error: memberError } = await supabase.rpc(
              "get_stokvel_members",
              {
                _stokvel_id: stokvel.id,
              },
            );

            if (!memberError) {
              members = memberData || [];
            } else {
              console.log("Member error:", memberError.message);
            }

            /* =========================
                                   NEXT PAYOUT
                                ========================= */

            let nextPayout = null;

            const { data: payoutData, error: payoutError } = await supabase
              .from("payouts")
              .select(
                `
                                        payout_date,
                                        status
                                    `,
              )
              .eq("stokvel_id", stokvel.id)
              .in("status", ["scheduled", "processing"])
              .gte("payout_date", new Date().toISOString().split("T")[0])
              .order("payout_date", {
                ascending: true,
              })
              .limit(1)
              .maybeSingle();

            if (!payoutError && payoutData) {
              nextPayout = formatDate(payoutData.payout_date);
            }

            /* =========================
                                   CURRENT CONTRIBUTION
                                ========================= */

            let contributionStatus = "due";

            const now = new Date();

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
              .toISOString()
              .split("T")[0];

            const { data: contributionData, error: contributionError } =
              await supabase
                .from("contributions")
                .select(
                  `
                                        id,
                                        status,
                                        contribution_date
                                    `,
                )
                .eq("stokvel_id", stokvel.id)
                .eq("user_id", user.id)
                .gte("contribution_date", startOfMonth)
                .eq("status", "paid")
                .order("contribution_date", {
                  ascending: false,
                })
                .limit(1)
                .maybeSingle();

            if (!contributionError && contributionData) {
              contributionStatus = "contributed";
            }

            return {
              ...membership,

              stokvel: {
                ...stokvel,

                members: members.length,

                membersList: members,

                nextPayout: nextPayout,

                contributionStatus: contributionStatus,
              },
            };
          }),
        );

        setStokvels(enrichedStokvels);
      } catch (error) {
        console.log("Load stokvels error:", error.message);
      } finally {
        setStokvelsLoading(false);
        setRefreshing(false);
      }
    }

    if (!authLoading) {
      loadStokvels();
    }
  }, [user, authLoading, refreshKey]);

  /* =====================================================
       RENDER
    ===================================================== */

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* =================================================
                    HEADER
                ================================================= */}

        <FadeInView style={styles.header}>
          <Pressable
            style={styles.leftHeader}
            onPress={() => setSidebarVisible(true)}
          >
            <View style={styles.menuButton}>
              <Menu size={20} strokeWidth={2} color={colors.white} />
            </View>

            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>

              <Text style={styles.name}>{profile?.full_name || "User"}</Text>
            </View>
          </Pressable>

          <View style={styles.rightHeader}>
            <BellButton />

            <Pressable
              onPress={() => navigation.navigate("EditProfile")}
              hitSlop={6}
            >
              <Image
                source={{
                  uri: profile?.profile_image_url || DEFAULT_AVATAR,
                }}
                style={styles.avatar}
              />
            </Pressable>
          </View>
        </FadeInView>

        {/* =================================================
                    BALANCE CARD
                ================================================= */}

        <FadeInView delay={120} style={styles.balanceCard}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{
              x: 0.1,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={styles.gradientCard}
          >
            <FloatingCircle style={styles.circleOne} />

            <FloatingCircle
              style={styles.circleTwo}
              distance={10}
              duration={4000}
            />

            <View style={styles.balanceTop}>
              <Text style={styles.balanceLabel}>TOTAL STOKVEL BALANCE</Text>

              <Pressable
                onPress={() => setBalanceHidden(!balanceHidden)}
                hitSlop={12}
              >
                {balanceHidden ? (
                  <EyeOff size={18} strokeWidth={2} color={colors.white} />
                ) : (
                  <Eye size={18} strokeWidth={2} color={colors.white} />
                )}
              </Pressable>
            </View>

            <BalanceAmount value={TOTAL_BALANCE} hidden={balanceHidden} />

            <View style={styles.balanceBottom}>
              <Text style={styles.balanceInfo}>Available balance</Text>

              <Text style={styles.balanceInfo}>+ R1,500 this month</Text>
            </View>
          </LinearGradient>
        </FadeInView>

        {/* =================================================
                    QUICK ACTIONS
                ================================================= */}
        {/* 
                <View style={styles.sectionHeader}>

                    <Text style={styles.sectionTitle}>
                        Quick actions
                    </Text>

                </View> */}

        {/* <View style={styles.actions}> */}

        {/* CONTRIBUTE */}

        {/* <Pressable
                        style={({ pressed }) => [
                            styles.action,
                            pressed &&
                                styles.actionPressed,
                        ]}
                    >

                        <View style={styles.actionIconContainer}>
                            <HandCoins
                                size={21}
                                strokeWidth={2}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.actionText}>
                            Contribute
                        </Text>

                    </Pressable> */}

        {/* MY STOKVELS */}

        {/* <Pressable
                        style={({ pressed }) => [
                            styles.action,
                            pressed &&
                                styles.actionPressed,
                        ]}
                        onPress={() =>
                            navigation.navigate(
                                'Stokvels'
                            )
                        }
                    >

                        <View style={styles.actionIconContainer}>
                            <Users2
                                size={21}
                                strokeWidth={2}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.actionText}>
                            My Stokvels
                        </Text>

                    </Pressable> */}

        {/* WALLET */}

        {/* <Pressable
                        style={({ pressed }) => [
                            styles.action,
                            pressed &&
                                styles.actionPressed,
                        ]}
                    >

                        <View style={styles.actionIconContainer}>
                            <CreditCard
                                size={21}
                                strokeWidth={2}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.actionText}>
                            Wallet
                        </Text>

                    </Pressable> */}

        {/* </View> */}

        {/* =================================================
                    MY STOKVELS HEADER
                ================================================= */}

        <FadeInView delay={240} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My stokvels</Text>

          <Pressable
            onPress={() => navigation.navigate("Stokvels")}
            hitSlop={10}
          >
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </FadeInView>

        {/* =================================================
                    LOADING
                ================================================= */}

        {stokvelsLoading ? (
          <View>
            <SkeletonCard />

            <SkeletonCard />
          </View>
        ) : stokvels.length === 0 ? (
          /* =================================================
                       EMPTY
                    ================================================= */

          <FadeInView delay={320}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Users2 size={21} color={colors.primary} />
              </View>

              <View style={styles.emptyContent}>
                <Text style={styles.emptyTitle}>No stokvels yet</Text>

                <Text style={styles.emptyText}>
                  Create or join a stokvel to get started.
                </Text>
              </View>
            </View>
          </FadeInView>
        ) : (
          /* =================================================
                       STOKVEL CARDS
                    ================================================= */

          stokvels.slice(0, 3).map((item, index) => {
            const stokvel = item.stokvel;

            return (
              <FadeInView key={stokvel.id} delay={320 + index * 110}>
                <ScalePressable
                  style={styles.stokvelCard}
                  onPress={() =>
                    navigation.navigate("StokvelDetail", {
                      id: stokvel.id,
                    })
                  }
                >
                  {/* =============================
                                        TOP
                                    ============================= */}

                  <View style={styles.stokvelTop}>
                    <View style={styles.stokvelTitleArea}>
                      <Text style={styles.stokvelName} numberOfLines={1}>
                        {stokvel.name}
                      </Text>

                      <Text style={styles.stokvelMembers}>
                        {stokvel.members || 0} members active
                      </Text>
                    </View>

                    <StatusBadge status={stokvel.contributionStatus} />
                  </View>

                  {/* =============================
                                        DIVIDER
                                    ============================= */}

                  <View style={styles.stokvelDivider} />

                  {/* =============================
                                        BOTTOM
                                    ============================= */}

                  <View style={styles.stokvelBottom}>
                    {/* MONTHLY PAY */}

                    <View style={styles.stokvelInfo}>
                      <Text style={styles.stokvelLabel}>
                        {stokvel.contribution_frequency === "monthly"
                          ? "MONTHLY PAY"
                          : "WEEKLY PAY"}
                      </Text>

                      <Text style={styles.stokvelValue}>
                        R
                        {Number(stokvel.contribution_amount).toLocaleString(
                          "en-ZA",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </Text>
                    </View>

                    {/* NEXT PAYOUT */}

                    <View style={styles.stokvelInfo}>
                      <Text style={styles.stokvelLabel}>NEXT PAYOUT</Text>

                      <Text style={styles.stokvelValue}>
                        {stokvel.nextPayout || "—"}
                      </Text>
                    </View>

                    {/* AVATARS */}

                    <AvatarStack members={stokvel.membersList || []} />
                  </View>
                </ScalePressable>
              </FadeInView>
            );
          })
        )}

        {/* =================================================
                    PROFILE SIDEBAR
                ================================================= */}

        <ProfileSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          user={{
            name: profile?.full_name || "User",

            email: profile?.email || user?.email || "",

            avatar: profile?.profile_image_url || DEFAULT_AVATAR,
          }}
          onEditProfile={() => {
            setSidebarVisible(false);

            navigation.navigate("EditProfile");
          }}
        />
      </ScrollView>

      {!stokvelsLoading && stokvels.length === 0 && (
        <QuickAddButton onPress={() => navigation.navigate("Stokvels")} />
      )}
    </View>
  );
}

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(dateString) {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  /* =====================================================
       SCREEN
    ===================================================== */

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 40,
  },

  /* =====================================================
       HEADER
    ===================================================== */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 25,
  },

  leftHeader: {
    flexDirection: "row",
    alignItems: "center",

    gap: 11,
  },

  rightHeader: {
    flexDirection: "row",
    alignItems: "center",

    gap: 10,
  },

  menuButton: {
    width: 43,
    height: 43,

    borderRadius: 22,

    backgroundColor: colors.primary,

    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,

  },

  greeting: {
    fontFamily: fonts.regular,

    fontSize: 11,
    lineHeight: 17,

    color: colors.textSecondary,
  },

  name: {
    fontFamily: "Outfit_700Bold",

    fontSize: 22,
    lineHeight: 24,

    color: colors.text,
  },

  notification: {
    width: 43,
    height: 43,

    borderRadius: 22,

    justifyContent: "center",
    alignItems: "center",
    backgroundColor:colors.white,


    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 7,
  },

  /* =====================================================
       BALANCE CARD
    ===================================================== */

  balanceCard: {
    marginBottom: 30,

    borderRadius: 22,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 14,

    elevation: 4,
  },

  gradientCard: {
    width: "100%",

    minHeight: 158,

    borderRadius: 22,

    paddingHorizontal: 21,
    paddingVertical: 20,

    overflow: "hidden",
  },

  circleOne: {
    position: "absolute",
    top: -38,
    right: -34,

    width: 150,
    height: 150,

    borderRadius: 75,

    backgroundColor: "rgba(255,255,255,0.09)",
  },

  circleTwo: {
    position: "absolute",
    bottom: -56,
    right: 46,

    width: 116,
    height: 116,

    borderRadius: 58,

    backgroundColor: "rgba(255,255,255,0.07)",
  },

  balanceTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  balanceLabel: {
    fontFamily: fonts.semibold,

    fontSize: 10,

    letterSpacing: 0.7,

    color: colors.white,

    opacity: 0.72,
  },

  balance: {
    fontFamily: "Outfit_700Bold",

    fontSize: 31,
    lineHeight: 38,

    color: colors.white,

    marginTop: 7,
    marginBottom: 22,

    letterSpacing: -0.5,
  },

  balanceBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  balanceInfo: {
    fontFamily: fonts.regular,

    fontSize: 11.5,

    color: colors.white,

    opacity: 0.78,
  },

  /* =====================================================
       SECTION
    ===================================================== */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 13,
  },

  sectionTitle: {
    fontFamily: "Outfit_700Bold",

    fontSize: 18,
    lineHeight: 23,

    color: colors.text,

    letterSpacing: -0.2,
  },

  viewAll: {
    fontFamily: fonts.semibold,

    fontSize: 12.5,

    color: colors.primary,
  },

  /* =====================================================
       QUICK ACTIONS
    ===================================================== */

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginBottom: 31,
  },

  action: {
    width: "31.5%",

    minHeight: 91,

    backgroundColor: colors.white,

    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    paddingVertical: 14,

    borderWidth: 1,
    borderColor: "#EEEEEE",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 7,

    elevation: 1,
  },

  actionPressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  actionIconContainer: {
    width: 40,
    height: 40,

    borderRadius: 12,

    backgroundColor: "#EAF7F1",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 8,
  },

  actionText: {
    fontFamily: fonts.semibold,

    fontSize: 11.5,

    color: colors.text,

    textAlign: "center",
  },

  /* =====================================================
       STOKVEL CARD
    ===================================================== */

  stokvelCard: {
    backgroundColor: colors.white,

    borderRadius: 17,

    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 14,

    marginBottom: 11,

    borderWidth: 1,
    borderColor: "#EEEEEE",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 8,

    elevation: 1,
  },

  stokvelCardPressed: {
    opacity: 0.88,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  /* =====================================================
       STOKVEL TOP
    ===================================================== */

  stokvelTop: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",
  },

  stokvelTitleArea: {
    flex: 1,

    paddingRight: 10,
  },

  stokvelName: {
    fontFamily: fonts.semibold,

    fontSize: 15.5,
    lineHeight: 20,

    color: colors.text,

    marginBottom: 2,
  },

  stokvelMembers: {
    fontFamily: fonts.regular,

    fontSize: 11.5,
    lineHeight: 16,

    color: colors.textSecondary,
  },

  /* =====================================================
       STATUS BADGE
    ===================================================== */

  statusBadge: {
    minHeight: 22,

    flexDirection: "row",

    gap: 6,

    borderRadius: 20,

    paddingHorizontal: 9,
    paddingVertical: 4,

    justifyContent: "center",
    alignItems: "center",
  },

  statusBadgeContributed: {
    backgroundColor: "#DDF3E8",
  },

  statusBadgeDue: {
    backgroundColor: "#FFE9E9",
  },

  statusText: {
    fontFamily: fonts.semibold,

    fontSize: 8.5,
    lineHeight: 12,

    letterSpacing: 0.35,
  },

  statusTextContributed: {
    color: "#127A4F",
  },

  statusTextDue: {
    color: "#E23434",
  },

  pulseWrap: {
    width: 8,
    height: 8,

    justifyContent: "center",
    alignItems: "center",
  },

  pulseRing: {
    position: "absolute",

    width: 8,
    height: 8,

    borderRadius: 4,
  },

  pulseCore: {
    width: 6,
    height: 6,

    borderRadius: 3,
  },

  /* =====================================================
       DIVIDER
    ===================================================== */

  stokvelDivider: {
    height: 1,

    backgroundColor: "#F1F1F1",

    marginTop: 13,
    marginBottom: 12,
  },

  /* =====================================================
       STOKVEL BOTTOM
    ===================================================== */

  stokvelBottom: {
    flexDirection: "row",

    alignItems: "flex-end",

    minHeight: 38,

    paddingRight: 17,
  },

  stokvelInfo: {
    minWidth: 82,
  },

  stokvelLabel: {
    fontFamily: fonts.regular,

    fontSize: 8.5,
    lineHeight: 12,

    color: colors.textSecondary,

    letterSpacing: 0.45,

    marginBottom: 2,
  },

  stokvelValue: {
    fontFamily: fonts.semibold,

    fontSize: 13,
    lineHeight: 18,

    color: colors.text,
  },

  /* =====================================================
       AVATARS
    ===================================================== */

  avatarStack: {
    flexDirection: "row",

    alignItems: "center",

    marginLeft: "auto",
  },

  avatarWrapper: {
    width: 27,
    height: 27,

    borderRadius: 14,

    borderWidth: 2,
    borderColor: colors.white,

    overflow: "hidden",

    backgroundColor: "#E8E8E8",
  },

  stackedAvatar: {
    width: "100%",
    height: "100%",
  },

  avatarFallback: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: colors.primaryDark,
  },

  avatarInitial: {
    color: colors.white,

    fontFamily: fonts.semibold,

    fontSize: 10,
  },

  extraAvatar: {
    justifyContent: "center",
    alignItems: "center",

    backgroundColor: colors.primaryDark,
  },

  extraAvatarText: {
    color: colors.white,

    fontFamily: fonts.semibold,

    fontSize: 9,
  },

  /* =====================================================
       CHEVRON
    ===================================================== */

  cardChevron: {
    position: "absolute",

    right: -2,
    bottom: 6,

    opacity: 0.35,
  },

  /* =====================================================
       LOADING
    ===================================================== */

  loadingCard: {
    backgroundColor: colors.white,

    borderRadius: 17,

    padding: 18,

    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  skeletonBar: {
    height: 12,

    borderRadius: 6,

    backgroundColor: "#E6E9E8",
  },

  /* =====================================================
       EMPTY
    ===================================================== */

  emptyCard: {
    backgroundColor: colors.white,

    borderRadius: 17,

    paddingHorizontal: 16,
    paddingVertical: 17,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  emptyIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: "#EAF7F1",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 12,
  },

  emptyContent: {
    flex: 1,
  },

  emptyTitle: {
    fontFamily: fonts.semibold,

    fontSize: 14,

    color: colors.text,

    marginBottom: 2,
  },

  emptyText: {
    fontFamily: fonts.regular,

    fontSize: 11.5,
    lineHeight: 17,

    color: colors.textSecondary,
  },

  fabWrap: {
    position: "absolute",
    right: 20,
    bottom: 18,

    width: 56,
    height: 56,

    justifyContent: "center",
    alignItems: "center",
  },

  fabRing: {
    position: "absolute",

    width: 56,
    height: 56,

    borderRadius: 28,

    backgroundColor: colors.primary,
  },

  fab: {
    width: 56,
    height: 56,

    borderRadius: 28,

    backgroundColor: colors.primary,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.32,
    shadowRadius: 10,

    elevation: 8,
  },
});
