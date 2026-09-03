import { useEffect, useState, useCallback } from 'react';

import {
    StyleSheet,
    Text,
    TextInput,
    View,
    Pressable,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';

import {
    ChevronLeft,
    Settings,
    Award,
    Wallet,
    Calendar,
    Users,
} from 'lucide-react-native';

import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

// const TABS = ['Overview', 'Members', 'Schedule', 'Rules'];
const TABS = ['Overview', 'Members']

/* ------------------------------------------------ */
/* HELPERS */
/* ------------------------------------------------ */

function formatDate(dateString, options) {
    if (!dateString) {
        return '—';
    }

    return new Date(dateString).toLocaleDateString('en-ZA', options);
}

function formatRand(amount) {
    return Number(amount || 0).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getCurrentMonthRange() {
    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const format = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd}`;
    };

    return {
        start: format(start),
        end: format(end),
    };
}

/* ------------------------------------------------ */
/* TAB BAR */
/* ------------------------------------------------ */

function TabBar({ active, onChange }) {
    return (
        <View style={styles.tabBar}>
            {TABS.map((tab) => {
                const isActive = tab === active;

                return (
                    <Pressable
                        key={tab}
                        style={[
                            styles.tabPill,
                            isActive && styles.tabPillActive,
                        ]}
                        onPress={() => onChange(tab)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                isActive && styles.tabTextActive,
                            ]}
                        >
                            {tab}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

/* ------------------------------------------------ */
/* OVERVIEW */
/* ------------------------------------------------ */

function OverviewTab({ stokvel, stats }) {
    return (
        <View>

            {/* TOTAL SAVINGS */}

            <View style={styles.balanceCard}>

                <View style={styles.balanceTop}>

                    <Text style={styles.balanceLabel}>
                        TOTAL POOLED SAVINGS
                    </Text>

                    <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>
                            {stokvel.status?.toUpperCase() || 'ACTIVE'}
                        </Text>
                    </View>

                </View>

                <Text style={styles.balanceAmount}>
                    R{formatRand(stats.totalPooled)}
                </Text>

                <View style={styles.balanceBottom}>

                    <View>
                        <Text style={styles.balanceStatLabel}>
                            Contribution
                        </Text>

                        <Text style={styles.balanceStatValue}>
                            R{formatRand(stokvel.contribution_amount)}
                            {' / '}
                            {stokvel.contribution_frequency}
                        </Text>
                    </View>

                    <View style={styles.balanceStatRight}>
                        <Text style={styles.balanceStatLabel}>
                            Next Payout
                        </Text>

                        <Text style={styles.balanceStatValue}>
                            {formatDate(
                                stats.nextPayoutDate,
                                {
                                    day: '2-digit',
                                    month: 'short',
                                }
                            )}
                        </Text>
                    </View>

                </View>

            </View>

            {/* CONTRIBUTIONS */}

            <View style={styles.contributionsCard}>

                <Text style={styles.contributionsLabel}>
                    THIS MONTH'S CONTRIBUTIONS
                </Text>

                <View style={styles.contributionsHeader}>

                    <View style={styles.progressCircle}>
                        <Text style={styles.progressCircleText}>
                            {stats.paidCount}/{stats.totalMembers}
                        </Text>
                    </View>

                    <View style={styles.contributionsInfo}>

                        <Text style={styles.contributionsHeadline}>
                            {stats.paidCount} of {stats.totalMembers} Members Paid
                        </Text>

                        <Text style={styles.contributionsSub}>
                            R{formatRand(stats.collected)}
                            {' of '}
                            R{formatRand(stats.expected)}
                            {' collected'}
                        </Text>

                    </View>

                </View>

                {/* PROGRESS BAR */}

                <View style={styles.progressBarBackground}>

                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${stats.paymentPercentage}%`,
                            },
                        ]}
                    />

                </View>

                <Text style={styles.progressPercentage}>
                    {stats.paymentPercentage}% collected
                </Text>

            </View>

            {/* QUICK ACTIONS */}

            <View style={styles.actionRow}>

                <Pressable style={styles.actionTile}>

                    <View
                        style={[
                            styles.actionIconWrapper,
                            styles.goalsIcon,
                        ]}
                    >
                        <Award
                            size={20}
                            color="#2A7DA6"
                        />
                    </View>

                    <Text style={styles.actionLabel}>
                        Goals
                    </Text>

                </Pressable>

                <Pressable style={styles.actionTile}>

                    <View
                        style={[
                            styles.actionIconWrapper,
                            styles.payoutIcon,
                        ]}
                    >
                        <Wallet
                            size={20}
                            color="#C6811F"
                        />
                    </View>

                    <Text style={styles.actionLabel}>
                        Payouts
                    </Text>

                </Pressable>

                <Pressable style={styles.actionTile}>

                    <View
                        style={[
                            styles.actionIconWrapper,
                            styles.meetingIcon,
                        ]}
                    >
                        <Calendar
                            size={20}
                            color="#2E6BA6"
                        />
                    </View>

                    <Text style={styles.actionLabel}>
                        Meetings
                    </Text>

                </Pressable>

            </View>

        </View>
    );
}

/* ------------------------------------------------ */
/* MEMBERS */
/* ------------------------------------------------ */

function MembersTab({
    members,
    stokvelId,
    navigation,
}) {
    if (members.length === 0) {
        return (
            <View style={styles.emptyCard}>

                <Users
                    size={28}
                    color={colors.textSecondary}
                />

                <Text style={styles.emptyTitle}>
                    No members found
                </Text>

                <Text style={styles.emptyText}>
                    This stokvel currently has no active members.
                </Text>

            </View>
        );
    }

    return (
        <View>

            <Text style={styles.memberCountText}>
                {members.length}{' '}
                {members.length === 1 ? 'Member' : 'Members'}
            </Text>

            {members.map((member, index) => (

                <Pressable
                    key={member.user_id}
                    onPress={() =>
                        navigation.navigate(
                            'MemberProfile',
                            {
                                stokvelId,
                                memberId: member.user_id,
                            }
                        )
                    }
                    style={[
                        styles.memberRow,
                        index !== members.length - 1 &&
                            styles.memberRowBorder,
                    ]}
                >

                    {member.profile_image_url ? (

                        <Image
                            source={{
                                uri: member.profile_image_url,
                            }}
                            style={styles.memberAvatar}
                        />

                    ) : (

                        <View
                            style={[
                                styles.memberAvatar,
                                styles.memberAvatarFallback,
                            ]}
                        >
                            <Users
                                size={18}
                                color={colors.textSecondary}
                            />
                        </View>

                    )}

                    <View style={styles.memberInfo}>

                        <Text style={styles.memberName}>
                            {member.full_name || 'Member'}
                        </Text>

                        <Text style={styles.memberJoined}>
                            Joined{' '}
                            {formatDate(
                                member.joined_at,
                                {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                }
                            )}
                        </Text>

                    </View>

                    {member.role !== 'member' && (

                        <View
                            style={[
                                styles.roleBadge,
                                member.role === 'admin'
                                    ? styles.roleBadgeAdmin
                                    : styles.roleBadgeTreasurer,
                            ]}
                        >

                            <Text
                                style={[
                                    styles.roleBadgeText,
                                    member.role === 'admin'
                                        ? styles.roleBadgeTextAdmin
                                        : styles.roleBadgeTextTreasurer,
                                ]}
                            >
                                {member.role.toUpperCase()}
                            </Text>

                        </View>

                    )}

                </Pressable>

            ))}

        </View>
    );
}

/* ------------------------------------------------ */
/* SCHEDULE */
/* ------------------------------------------------ */

function ScheduleTab({ scheduleGroups }) {
    if (scheduleGroups.length === 0) {
        return (
            <View style={styles.emptyCard}>

                <Calendar
                    size={28}
                    color={colors.textSecondary}
                />

                <Text style={styles.emptyTitle}>
                    No scheduled events
                </Text>

                <Text style={styles.emptyText}>
                    Upcoming payouts and meetings will appear here.
                </Text>

            </View>
        );
    }

    return (
        <View>

            {scheduleGroups.map((group) => (

                <View
                    key={group.month}
                    style={styles.scheduleGroup}
                >

                    <Text style={styles.scheduleMonth}>
                        {group.month}
                    </Text>

                    {group.items.map((item) => (

                        <View
                            key={item.id}
                            style={styles.scheduleCard}
                        >

                            <View style={styles.scheduleDateBox}>

                                <Text style={styles.scheduleDateDay}>
                                    {item.day}
                                </Text>

                                <Text style={styles.scheduleDateMonth}>
                                    {item.monthShort}
                                </Text>

                            </View>

                            <View style={styles.scheduleContent}>

                                <Text style={styles.scheduleTitle}>
                                    {item.title}
                                </Text>

                                <Text style={styles.scheduleAmount}>
                                    {item.subtitle}
                                </Text>

                                {item.tag && (

                                    <View style={styles.scheduleTag}>

                                        <Text style={styles.scheduleTagText}>
                                            {item.tag}
                                        </Text>

                                    </View>

                                )}

                            </View>

                        </View>

                    ))}

                </View>

            ))}

        </View>
    );
}

/* ------------------------------------------------ */
/* RULES */
/* ------------------------------------------------ */

function RulesTab({
    stokvelId,
    rules,
    isAdmin,
    onRulesChanged,
}) {
    const [editing, setEditing] = useState(false);
    const [newRule, setNewRule] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleAddRule() {

        if (!newRule.trim()) {
            Alert.alert(
                'Missing rule',
                'Please enter a rule before adding it.'
            );
            return;
        }

        try {

            setSaving(true);

            const { error } = await supabase
                .from('group_rules')
                .insert({
                    stokvel_id: stokvelId,
                    rule_text: newRule.trim(),
                    display_order: rules.length,
                });

            if (error) {
                throw error;
            }

            setNewRule('');

            await onRulesChanged();

        } catch (error) {

            Alert.alert(
                'Failed to add rule',
                error.message
            );

        } finally {

            setSaving(false);

        }
    }

    async function handleDeleteRule(ruleId) {

        Alert.alert(
            'Remove Rule',
            'Are you sure you want to remove this rule?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {

                        const { error } = await supabase
                            .from('group_rules')
                            .delete()
                            .eq('id', ruleId);

                        if (error) {

                            Alert.alert(
                                'Failed to delete rule',
                                error.message
                            );

                            return;
                        }

                        await onRulesChanged();

                    },
                },
            ]
        );
    }

    return (
        <View>

            <Text style={styles.rulesHeading}>
                GROUP CONSTITUTION
            </Text>

            {rules.length === 0 ? (

                <View style={styles.emptyCard}>

                    <Text style={styles.emptyTitle}>
                        No rules yet
                    </Text>

                    <Text style={styles.emptyText}>
                        The stokvel constitution has not been added yet.
                    </Text>

                </View>

            ) : (

                rules.map((rule, index) => (

                    <View
                        key={rule.id}
                        style={styles.ruleCard}
                    >

                        <Text
                            style={[
                                styles.ruleText,
                                editing && {
                                    marginBottom: 8,
                                },
                            ]}
                        >

                            <Text style={styles.ruleNumber}>
                                {index + 1}.{' '}
                            </Text>

                            {rule.rule_text}

                        </Text>

                        {editing && (

                            <Pressable
                                onPress={() =>
                                    handleDeleteRule(rule.id)
                                }
                            >

                                <Text style={styles.removeRuleText}>
                                    Remove
                                </Text>

                            </Pressable>

                        )}

                    </View>

                ))

            )}

            {editing && (

                <View style={styles.addRuleRow}>

                    <TextInput
                        style={styles.addRuleInput}
                        placeholder="Type a new rule..."
                        placeholderTextColor={
                            colors.textSecondary
                        }
                        value={newRule}
                        onChangeText={setNewRule}
                        multiline
                    />

                    <Pressable
                        style={[
                            styles.addRuleButton,
                            saving && {
                                opacity: 0.6,
                            },
                        ]}
                        onPress={handleAddRule}
                        disabled={saving}
                    >

                        <Text style={styles.addRuleButtonText}>
                            {saving
                                ? 'ADDING...'
                                : 'Add Rule'}
                        </Text>

                    </Pressable>

                </View>

            )}

            {isAdmin && (

                <Pressable
                    style={styles.editRulesButton}
                    onPress={() =>
                        setEditing(!editing)
                    }
                >

                    <Text style={styles.editRulesButtonText}>
                        {editing
                            ? 'Done Editing'
                            : 'Edit Rules (Admin Only)'}
                    </Text>

                </Pressable>

            )}

        </View>
    );
}

/* ------------------------------------------------ */
/* MAIN SCREEN */
/* ------------------------------------------------ */

export default function StokvelDetailsScreen({
    route,
    navigation,
}) {
    const { id } = route.params;

    const { user } = useAuth();

    const [activeTab, setActiveTab] =
        useState('Overview');

    const [stokvel, setStokvel] =
        useState(null);

    const [members, setMembers] =
        useState([]);

    const [rules, setRules] =
        useState([]);

    const [scheduleGroups, setScheduleGroups] =
        useState([]);

    const [stats, setStats] = useState({
        totalPooled: 0,
        nextPayoutDate: null,
        paidCount: 0,
        totalMembers: 0,
        collected: 0,
        expected: 0,
        paymentPercentage: 0,
    });

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const currentMember = members.find(
        (member) =>
            member.user_id === user?.id
    );

    const isAdmin =
        currentMember?.role === 'admin' ||
        currentMember?.role === 'treasurer';

    const loadData = useCallback(
        async () => {

            try {

                setLoading(true);
                setError('');

                /* ----------------------------- */
                /* STOKVEL */
                /* ----------------------------- */

                const {
                    data: stokvelRow,
                    error: stokvelError,
                } = await supabase
                    .from('stokvels')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (stokvelError) {
                    throw stokvelError;
                }

                setStokvel(stokvelRow);

                /* ----------------------------- */
                /* MEMBERS */
                /* ----------------------------- */

                const {
                    data: memberRows,
                    error: memberError,
                } = await supabase
                    .from('stokvel_members')
                    .select(`
                        user_id,
                        role,
                        joined_at,
                        profiles (
                            full_name,
                            profile_image_url
                        )
                    `)
                    .eq('stokvel_id', id)
                    .eq('status', 'active')
                    .order('joined_at', {
                        ascending: true,
                    });

                if (memberError) {
                    throw memberError;
                }

                const formattedMembers =
                    (memberRows || []).map((member) => ({
                        user_id: member.user_id,
                        role: member.role,
                        joined_at: member.joined_at,
                        full_name:
                            member.profiles?.full_name ||
                            'Member',
                        profile_image_url:
                            member.profiles
                                ?.profile_image_url ||
                            null,
                    }));

                setMembers(formattedMembers);

                /* ----------------------------- */
                /* RULES */
                /* ----------------------------- */

                const {
                    data: ruleRows,
                    error: ruleError,
                } = await supabase
                    .from('group_rules')
                    .select('*')
                    .eq('stokvel_id', id)
                    .order('display_order', {
                        ascending: true,
                    });

                if (ruleError) {
                    console.log(
                        'Rules error:',
                        ruleError.message
                    );

                    setRules([]);
                } else {
                    setRules(ruleRows || []);
                }

                /* ----------------------------- */
                /* PAYOUTS */
                /* ----------------------------- */

                const {
                    data: payoutRows,
                    error: payoutError,
                } = await supabase
                    .from('payouts')
                    .select(`
                        id,
                        amount,
                        payout_date,
                        status,
                        profiles:recipient_id (
                            full_name
                        )
                    `)
                    .eq('stokvel_id', id)
                    .order('payout_date', {
                        ascending: true,
                    });

                if (payoutError) {
                    console.log(
                        'Payout error:',
                        payoutError.message
                    );
                }

                /* ----------------------------- */
                /* MEETINGS */
                /* ----------------------------- */

                const {
                    data: meetingRows,
                    error: meetingError,
                } = await supabase
                    .from('meetings')
                    .select('*')
                    .eq('stokvel_id', id)
                    .order('scheduled_at', {
                        ascending: true,
                    });

                if (meetingError) {
                    console.log(
                        'Meeting error:',
                        meetingError.message
                    );
                }

                /* ----------------------------- */
                /* SCHEDULE */
                /* ----------------------------- */

                const today =
                    new Date()
                        .toISOString()
                        .split('T')[0];

                const scheduleItems = [

                    ...(payoutRows || []).map(
                        (payout) => {

                            const date =
                                new Date(
                                    payout.payout_date
                                );

                            return {
                                id:
                                    `payout-${payout.id}`,
                                date,
                                day:
                                    date.getDate(),
                                monthShort:
                                    date
                                        .toLocaleDateString(
                                            'en-ZA',
                                            {
                                                month: 'short',
                                            }
                                        )
                                        .toUpperCase(),
                                title:
                                    `Payout to ${
                                        payout.profiles
                                            ?.full_name ||
                                        'Member'
                                    }`,
                                subtitle:
                                    `R${formatRand(
                                        payout.amount
                                    )}`,
                                tag:
                                    payout.payout_date >=
                                    today
                                        ? 'Upcoming'
                                        : null,
                            };
                        }
                    ),

                    ...(meetingRows || []).map(
                        (meeting) => {

                            const date =
                                new Date(
                                    meeting.scheduled_at
                                );

                            return {
                                id:
                                    `meeting-${meeting.id}`,
                                date,
                                day:
                                    date.getDate(),
                                monthShort:
                                    date
                                        .toLocaleDateString(
                                            'en-ZA',
                                            {
                                                month: 'short',
                                            }
                                        )
                                        .toUpperCase(),
                                title:
                                    meeting.title ||
                                    'Stokvel Meeting',
                                subtitle:
                                    date.toLocaleTimeString(
                                        'en-ZA',
                                        {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }
                                    ),
                                tag:
                                    meeting.location ||
                                    null,
                            };
                        }
                    ),

                ].sort(
                    (a, b) =>
                        a.date - b.date
                );

                const groupsMap = {};

                scheduleItems.forEach((item) => {

                    const key =
                        item.date.toLocaleDateString(
                            'en-ZA',
                            {
                                month: 'long',
                                year: 'numeric',
                            }
                        ).toUpperCase();

                    if (!groupsMap[key]) {
                        groupsMap[key] = [];
                    }

                    groupsMap[key].push(item);

                });

                setScheduleGroups(
                    Object.entries(groupsMap).map(
                        ([month, items]) => ({
                            month,
                            items,
                        })
                    )
                );

                /* ----------------------------- */
                /* CONTRIBUTIONS */
                /* ----------------------------- */

                const {
                    start,
                    end,
                } = getCurrentMonthRange();

                const {
                    data: currentMonthContributions,
                    error: contributionError,
                } = await supabase
                    .from('contributions')
                    .select(
                        'user_id, amount, status, contribution_date'
                    )
                    .eq('stokvel_id', id)
                    .eq('status', 'paid')
                    .gte(
                        'contribution_date',
                        start
                    )
                    .lte(
                        'contribution_date',
                        end
                    );

                if (contributionError) {
                    throw contributionError;
                }

                /* ----------------------------- */
                /* TOTAL POOLED SAVINGS */
                /* ----------------------------- */

                const {
                    data: allPaidContributions,
                    error: allContributionError,
                } = await supabase
                    .from('contributions')
                    .select('amount')
                    .eq('stokvel_id', id)
                    .eq('status', 'paid');

                if (allContributionError) {
                    throw allContributionError;
                }

                const totalPooled =
                    (allPaidContributions || [])
                        .reduce(
                            (sum, contribution) =>
                                sum +
                                Number(
                                    contribution.amount
                                ),
                            0
                        );

                /* ----------------------------- */
                /* MONTHLY STATS */
                /* ----------------------------- */

                const paidCount =
                    new Set(
                        (
                            currentMonthContributions ||
                            []
                        ).map(
                            (contribution) =>
                                contribution.user_id
                        )
                    ).size;

                const totalMembers =
                    formattedMembers.length;

                const expected =
                    Number(
                        stokvelRow?.contribution_amount ||
                        0
                    ) * totalMembers;

                const collected =
                    (
                        currentMonthContributions ||
                        []
                    ).reduce(
                        (sum, contribution) =>
                            sum +
                            Number(
                                contribution.amount
                            ),
                        0
                    );

                const paymentPercentage =
                    expected > 0
                        ? Math.min(
                              100,
                              Math.round(
                                  (collected /
                                      expected) *
                                      100
                              )
                          )
                        : 0;

                /* ----------------------------- */
                /* NEXT PAYOUT */
                /* ----------------------------- */

                const upcomingPayout =
                    (payoutRows || []).find(
                        (payout) =>
                            payout.payout_date >=
                                today &&
                            payout.status !==
                                'cancelled'
                    );

                /* ----------------------------- */
                /* FINAL STATS */
                /* ----------------------------- */

                setStats({
                    totalPooled,
                    nextPayoutDate:
                        upcomingPayout?.payout_date ||
                        null,
                    paidCount,
                    totalMembers,
                    collected,
                    expected,
                    paymentPercentage,
                });

            } catch (err) {

                console.log(
                    'Stokvel details error:',
                    err.message
                );

                setError(
                    err.message ||
                    'Failed to load stokvel.'
                );

            } finally {

                setLoading(false);

            }

        },
        [id]
    );

    useEffect(() => {
        loadData();
    }, [loadData]);

    /* ------------------------------------------------ */
    /* LOADING */
    /* ------------------------------------------------ */

    if (loading) {
        return (
            <View style={styles.loadingContainer}>

                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />

                <Text style={styles.loadingText}>
                    Loading stokvel...
                </Text>

            </View>
        );
    }

    /* ------------------------------------------------ */
    /* ERROR */
    /* ------------------------------------------------ */

    if (error || !stokvel) {
        return (
            <View style={styles.loadingContainer}>

                <Text style={styles.errorTitle}>
                    Unable to load stokvel
                </Text>

                <Text style={styles.errorText}>
                    {error || 'Stokvel not found.'}
                </Text>

                <Pressable
                    style={styles.retryButton}
                    onPress={loadData}
                >

                    <Text style={styles.retryButtonText}>
                        Try Again
                    </Text>

                </Pressable>

            </View>
        );
    }

    /* ------------------------------------------------ */
    /* UI */
    /* ------------------------------------------------ */

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >

            {/* HEADER */}

            <View style={styles.header}>

                <Pressable
                    style={styles.backButton}
                    onPress={() =>
                        navigation.goBack()
                    }
                >
                    <ChevronLeft
                        size={22}
                        color={colors.text}
                    />
                </Pressable>

                <View style={styles.headerRight}>

                    <Pressable
                        style={styles.inviteButton}
                        onPress={() => navigation.navigate('InviteMember',{ id })}
                    >

                        <Text
                            style={styles.inviteButtonText}
                        >
                            Invite Members
                        </Text>

                    </Pressable>

                    <Pressable
                        style={styles.settingsButton}
                        onPress={() =>
                            navigation.navigate(
                                'GroupSettings',
                                { id }
                            )
                        }
                    >

                        <Settings
                            size={18}
                            color={colors.text}
                        />

                    </Pressable>

                </View>

            </View>

            {/* STOKVEL HEADER */}

            <View style={styles.groupHeader}>

                <View style={styles.groupBadge}>

                    <Users
                        size={28}
                        color={colors.primary}
                    />

                </View>

                <Text style={styles.groupName}>
                    {stokvel.name}
                </Text>

                <Text style={styles.groupMeta}>
                    Created{' '}
                    {formatDate(
                        stokvel.created_at,
                        {
                            month: 'short',
                            year: 'numeric',
                        }
                    )}
                    {' · '}
                    {members.length}{' '}
                    {members.length === 1
                        ? 'member'
                        : 'members'}
                </Text>

            </View>

            {/* TABS */}

            <TabBar
                active={activeTab}
                onChange={setActiveTab}
            />

            {/* TAB CONTENT */}

            {activeTab === 'Overview' && (

                <OverviewTab
                    stokvel={stokvel}
                    stats={stats}
                />

            )}

            {activeTab === 'Members' && (

                <MembersTab
                    members={members}
                    stokvelId={stokvel.id}
                    navigation={navigation}
                />

            )}

            {activeTab === 'Schedule' && (

                <ScheduleTab
                    scheduleGroups={
                        scheduleGroups
                    }
                />

            )}

            {activeTab === 'Rules' && (

                <RulesTab
                    stokvelId={id}
                    rules={rules}
                    isAdmin={isAdmin}
                    onRulesChanged={
                        loadData
                    }
                />

            )}

        </ScrollView>
    );
}

/* ------------------------------------------------ */
/* STYLES */
/* ------------------------------------------------ */

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    content: {
        padding: 20,
        paddingTop: 45,
        paddingBottom: 50,
    },

    /* HEADER */

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },

    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },

    inviteButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },

    inviteButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 12,
    },

    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* GROUP HEADER */

    groupHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },

    groupBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 3,
        borderColor: colors.border,
    },

    groupName: {
        fontFamily: fonts.bold,
        fontSize: 20,
        color: colors.text,
        marginBottom: 4,
        textAlign: 'center',
    },

    groupMeta: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
    },

    /* TABS */

    tabBar: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },

    tabPill: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        alignItems: 'center',
    },

    tabPillActive: {
        backgroundColor: colors.primaryDark,
    },

    tabText: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
    },

    tabTextActive: {
        color: colors.white,
    },

    /* BALANCE */

    balanceCard: {
        backgroundColor: colors.primaryDark,
        borderRadius: 20,
        padding: 22,
        marginBottom: 16,
    },

    balanceTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    balanceLabel: {
        color: colors.white,
        opacity: 0.7,
        fontFamily: fonts.semibold,
        fontSize: 11,
    },

    activeBadge: {
        backgroundColor:
            'rgba(255,255,255,0.15)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    activeBadgeText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 10,
    },

    balanceAmount: {
        color: colors.white,
        fontFamily: fonts.bold,
        fontSize: 30,
        marginBottom: 22,
    },

    balanceBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    balanceStatRight: {
        alignItems: 'flex-end',
    },

    balanceStatLabel: {
        color: colors.white,
        opacity: 0.6,
        fontFamily: fonts.regular,
        fontSize: 11,
        marginBottom: 4,
    },

    balanceStatValue: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 13,
        textTransform: 'capitalize',
    },

    /* CONTRIBUTIONS */

    contributionsCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
    },

    contributionsLabel: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        letterSpacing: 0.3,
        marginBottom: 14,
    },

    contributionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    progressCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 5,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    progressCircleText: {
        fontFamily: fonts.bold,
        fontSize: 12,
        color: colors.text,
    },

    contributionsInfo: {
        flex: 1,
    },

    contributionsHeadline: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
        marginBottom: 4,
    },

    contributionsSub: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },

    progressBarBackground: {
        height: 7,
        borderRadius: 10,
        backgroundColor: colors.background,
        overflow: 'hidden',
        marginTop: 18,
    },

    progressBarFill: {
        height: '100%',
        borderRadius: 10,
        backgroundColor: colors.primary,
    },

    progressPercentage: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 7,
        textAlign: 'right',
    },

    /* ACTIONS */

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },

    actionTile: {
        width: '31%',
        backgroundColor: colors.white,
        borderRadius: 15,
        paddingVertical: 16,
        alignItems: 'center',
    },

    actionIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },

    goalsIcon: {
        backgroundColor: '#DCEEF5',
    },

    payoutIcon: {
        backgroundColor: '#FCEBD5',
    },

    meetingIcon: {
        backgroundColor: '#DDEAF5',
    },

    actionLabel: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.text,
    },

    /* MEMBERS */

    memberCountText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 10,
    },

    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginBottom: 10,
    },

    memberRowBorder: {},

    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 14,
    },

    memberAvatarFallback: {
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },

    memberInfo: {
        flex: 1,
    },

    memberName: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
        marginBottom: 2,
    },

    memberJoined: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },

    roleBadge: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },

    roleBadgeAdmin: {
        backgroundColor: '#DDF3E8',
    },

    roleBadgeTreasurer: {
        backgroundColor: '#FCEBD5',
    },

    roleBadgeText: {
        fontFamily: fonts.semibold,
        fontSize: 10,
    },

    roleBadgeTextAdmin: {
        color: '#127A4F',
    },

    roleBadgeTextTreasurer: {
        color: '#C6811F',
    },

    /* SCHEDULE */

    scheduleGroup: {
        marginBottom: 20,
    },

    scheduleMonth: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 10,
    },

    scheduleCard: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },

    scheduleDateBox: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryLight,
        borderRadius: 10,
        paddingVertical: 8,
        marginRight: 14,
    },

    scheduleDateDay: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: colors.primary,
    },

    scheduleDateMonth: {
        fontFamily: fonts.semibold,
        fontSize: 10,
        color: colors.primary,
    },

    scheduleContent: {
        flex: 1,
    },

    scheduleTitle: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.text,
        marginBottom: 3,
    },

    scheduleAmount: {
        fontFamily: fonts.bold,
        fontSize: 15,
        color: colors.primary,
        marginBottom: 6,
    },

    scheduleTag: {
        alignSelf: 'flex-start',
        backgroundColor: colors.background,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },

    scheduleTagText: {
        fontFamily: fonts.regular,
        fontSize: 10,
        color: colors.textSecondary,
    },

    /* RULES */

    rulesHeading: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textSecondary,
        letterSpacing: 0.3,
        marginBottom: 12,
    },

    ruleCard: {
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
    },

    ruleText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
    },

    ruleNumber: {
        fontFamily: fonts.bold,
        color: colors.primary,
    },

    editRulesButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
    },

    editRulesButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 14,
    },

    removeRuleText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.danger,
    },

    addRuleRow: {
        marginBottom: 16,
    },

    addRuleInput: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 14,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.text,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 10,
    },

    addRuleButton: {
        backgroundColor: colors.primaryLight,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },

    addRuleButtonText: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.primary,
    },

    /* EMPTY STATES */

    emptyCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
    },

    emptyTitle: {
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.text,
        marginTop: 12,
        marginBottom: 5,
    },

    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },

    /* LOADING */

    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },

    loadingText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 12,
    },

    /* ERROR */

    errorTitle: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },

    errorText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },

    retryButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: 25,
        paddingHorizontal: 25,
        paddingVertical: 12,
    },

    retryButtonText: {
        color: colors.white,
        fontFamily: fonts.semibold,
        fontSize: 13,
    },

});