import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useCreateNalamCheckin, useGetNalamDashboard, getGetNalamDashboardQueryKey } from '@workspace/api-client-react';
import type { NalamCheckin, NalamCheckinKind, NalamDashboard } from '@workspace/api-client-react';
import { AlertCircle, Bell, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, Heart, LoaderCircle, MessageCircle, Phone, Pill, ShieldCheck, Sparkles, UserRound, UsersRound } from 'lucide-react';

const queryClient = new QueryClient();
type View = 'elder' | 'family';
type Language = 'en' | 'ta';
const TIME_ZONE = 'Asia/Kolkata';

const words = {
  en: {
    elder: 'Elder view', family: 'Family view', english: 'English', tamil: 'தமிழ்',
    greeting: (name: string, time: string) => `${time}, ${name}`,
    morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening',
    ready: 'A little hello goes a long way.', fine: "I'm fine 👍", medicine: 'I took my medicine 💊',
    help: 'I need help', holdHint: 'Press and hold for 3 seconds, or tap to confirm',
    fineSuccess: 'Lovely to hear from you!', medicineSuccess: 'Medicine noted. Thank you!',
    helpSuccess: 'Your family has been notified.', sent: 'Just now',
    today: 'Today', familyTitle: 'A little peace of mind', familySub: 'A quiet update from home, whenever it comes.',
    status: 'TODAY’S STATUS', checked: 'All is well', waiting: 'No check-in yet',
    helpNeeded: 'Amma needs help', checkedAt: 'Checked in at', expected: 'Expected by',
    timeline: 'Today’s timeline', medicineTitle: 'Medicine', medicineTaken: 'Taken today',
    medicineWaiting: 'No medicine confirmation yet', history: 'Recent days', dayToday: 'Today',
    noEvents: 'No updates', sample: 'Sample history', live: 'Live updates every 5 seconds',
    call: 'Call Appa', message: 'Message Appa', contactLabel: 'Appa’s phone number', contactPlaceholder: 'Enter a phone number', contactHint: 'Add a number to enable calling and messaging.', retry: 'Try again', loading: 'Checking in with home…',
    error: 'We couldn’t reach the dashboard.', switcher: 'VIEWING',
    confirmTitle: 'Would you like your family to help?', confirmText: 'We’ll let them know right away. Choose “Yes, I need help” to continue.',
    cancel: 'Not now', confirm: 'Yes, I need help', hold: 'Keep holding…',
    connected: 'Your family is close by', privacy: 'Only your family sees these updates',
    dateToday: 'Today', yesterday: 'Yesterday', daysAgo: (n: number) => `${n} days ago`,
  },
  ta: {
    elder: 'முதியோர் பார்வை', family: 'குடும்பப் பார்வை', english: 'English', tamil: 'தமிழ்',
    greeting: (name: string, time: string) => `${time}, ${name}`,
    morning: 'காலை வணக்கம்', afternoon: 'மதிய வணக்கம்', evening: 'மாலை வணக்கம்',
    ready: 'ஒரு சிறிய வணக்கம், அன்பானவர்களுக்கு நிம்மதி.', fine: 'நான் நலமாக இருக்கிறேன் 👍',
    medicine: 'மருந்து எடுத்துவிட்டேன் 💊', help: 'எனக்கு உதவி தேவை',
    holdHint: '3 விநாடிகள் அழுத்திப் பிடிக்கவும் அல்லது தட்டி உறுதிப்படுத்தவும்',
    fineSuccess: 'உங்கள் செய்தி கேட்டு மகிழ்ச்சி!', medicineSuccess: 'மருந்து பதிவு செய்யப்பட்டது. நன்றி!',
    helpSuccess: 'உங்கள் குடும்பத்திற்குத் தெரிவிக்கப்பட்டது.', sent: 'இப்போது',
    today: 'இன்று', familyTitle: 'குடும்பத்தின் நிம்மதி', familySub: 'வீட்டிலிருந்து வரும் ஒரு சிறிய செய்தி.',
    status: 'இன்றைய நிலை', checked: 'எல்லாம் நலம்', waiting: 'இன்னும் தகவல் வரவில்லை',
    helpNeeded: 'அப்பாவுக்கு உதவி தேவை', checkedAt: 'தெரிவித்த நேரம்', expected: 'எதிர்பார்க்கும் நேரம்',
    timeline: 'இன்றைய நிகழ்வுகள்', medicineTitle: 'மருந்து', medicineTaken: 'இன்று எடுத்துவிட்டார்',
    medicineWaiting: 'மருந்து குறித்த தகவல் இன்னும் இல்லை', history: 'சமீபத்திய நாட்கள்',
    dayToday: 'இன்று', noEvents: 'புதுப்பிப்புகள் இல்லை', sample: 'மாதிரி வரலாறு',
    live: 'ஒவ்வொரு 5 விநாடிக்கும் புதுப்பிக்கப்படும்', call: 'அம்மாவை அழைக்கவும்',
    message: 'அப்பாவுக்கு செய்தி', contactLabel: 'அப்பாவின் தொலைபேசி எண்', contactPlaceholder: 'தொலைபேசி எண்ணை உள்ளிடவும்', contactHint: 'அழைக்கவும் செய்தி அனுப்பவும் எண்ணைச் சேர்க்கவும்.', retry: 'மீண்டும் முயற்சிக்கவும்', loading: 'வீட்டின் நிலையைப் பார்க்கிறோம்…',
    error: 'நிலையைப் பெற முடியவில்லை.', switcher: 'பார்ப்பது',
    confirmTitle: 'உங்கள் குடும்பத்தின் உதவி வேண்டுமா?', confirmText: 'உடனே அவர்களுக்குத் தெரிவிப்போம். தொடர “ஆம், உதவி தேவை” என்பதைத் தேர்ந்தெடுக்கவும்.',
    cancel: 'இப்போது வேண்டாம்', confirm: 'ஆம், உதவி தேவை', hold: 'அழுத்திப் பிடிக்கவும்…',
    connected: 'உங்கள் குடும்பம் அருகில் இருக்கிறது', privacy: 'இந்தத் தகவலை உங்கள் குடும்பம் மட்டுமே பார்க்கலாம்',
    dateToday: 'இன்று', yesterday: 'நேற்று', daysAgo: (n: number) => `${n} நாட்களுக்கு முன்`,
  },
};

function AppContent() {
  const [view, setView] = useState<View>('elder');
  const [language, setLanguage] = useState<Language>('en');
  const [success, setSuccess] = useState<NalamCheckinKind | null>(null);
  const [confirmHelp, setConfirmHelp] = useState(false);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const holdTriggered = useRef(false);
  const t = words[language];
  const queryClientRef = useQueryClient();
  const dashboardQueryKey = getGetNalamDashboardQueryKey();
  const dashboardQuery = useGetNalamDashboard({ query: { queryKey: dashboardQueryKey, refetchInterval: 5000 } });
  const checkinMutation = useCreateNalamCheckin();
  const dashboard = dashboardQuery.data as NalamDashboard | undefined;

  const submitCheckin = useCallback((kind: NalamCheckinKind) => {
    setConfirmHelp(false);
    setHolding(false);
    setSuccess(null);
    checkinMutation.mutate({ data: { kind } }, {
      onSuccess: () => {
        setSuccess(kind);
        queryClientRef.invalidateQueries({ queryKey: dashboardQueryKey });
        window.setTimeout(() => setSuccess(null), 4500);
      },
    });
  }, [checkinMutation, dashboardQueryKey, queryClientRef]);

  const stopHold = useCallback(() => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  }, []);

  const startHold = useCallback(() => {
    holdTriggered.current = false;
    setHolding(true);
    holdTimer.current = window.setTimeout(() => {
      holdTriggered.current = true;
      submitCheckin('help');
    }, 3000);
  }, [submitCheckin]);

  const onHelpClick = useCallback(() => {
    if (holdTriggered.current) {
      holdTriggered.current = false;
      return;
    }
    setConfirmHelp(true);
  }, []);

  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
  }, []);

  if (dashboardQuery.isLoading) return <Loading t={t} />;
  if (dashboardQuery.isError || !dashboard) {
    return <ErrorScreen message={t.error} retry={() => dashboardQuery.refetch()} retryLabel={t.retry} />;
  }

  return (
    <main className="app-shell px-4 pb-10 pt-4 sm:px-8 sm:pt-7">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#276b4b] text-[#fff9e9]">
              <Heart size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-[Manrope] text-[26px] font-extrabold leading-none tracking-[-1.2px] text-[#244b3a]">nalam<span className="text-[#d5a24c]">.</span></div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[.16em] text-[#718074]">A little hello, a lot of love</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-full border border-[#e3ddca] bg-[#fbf9f1] p-1">
              <button data-testid="button-language-en" onClick={() => setLanguage('en')} className={`rounded-full px-3 py-2 text-sm font-semibold transition ${language === 'en' ? 'bg-[#286b4b] text-white shadow-sm' : 'text-[#5e6c60]'}`}>EN</button>
              <button data-testid="button-language-ta" onClick={() => setLanguage('ta')} className={`rounded-full px-3 py-2 text-sm font-semibold transition ${language === 'ta' ? 'bg-[#286b4b] text-white shadow-sm' : 'text-[#5e6c60]'}`}>தமிழ்</button>
            </div>
          </div>
        </header>

        <div className="mb-7 flex flex-col gap-4 border-b border-[#e2ddcd] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#859084]"><span className="h-2 w-2 rounded-full bg-[#63a779]" /> {t.switcher}</div>
            <div className="inline-flex rounded-2xl border border-[#e5dfce] bg-[#eae6d9] p-1">
              <button data-testid="button-view-elder" onClick={() => setView('elder')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'elder' ? 'bg-[#fbf9f1] text-[#285f43] shadow-sm' : 'text-[#738074]'}`}>
                <UserRound size={17} /> {t.elder}
              </button>
              <button data-testid="button-view-family" onClick={() => setView('family')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === 'family' ? 'bg-[#fbf9f1] text-[#285f43] shadow-sm' : 'text-[#738074]'}`}>
                <UsersRound size={17} /> {t.family}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#778275]"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#73a981] opacity-40" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#5b956e]" /></span>{t.live}</div>
        </div>

        {view === 'elder' ? (
          <ElderView dashboard={dashboard} t={t} language={language} success={success} pending={checkinMutation.isPending}
            holding={holding} onFine={() => submitCheckin('fine')} onMedicine={() => submitCheckin('medicine')}
            onHelpTap={onHelpClick} onHelpStart={startHold} onHelpStop={stopHold} />
        ) : (
          <FamilyView dashboard={dashboard} t={t} language={language} />
        )}
      </div>

      {confirmHelp && <div className="fixed inset-0 z-50 grid place-items-center bg-[#173326]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div className="enter w-full max-w-md rounded-[28px] border border-[#ead8d1] bg-[#fffaf5] p-7 text-center shadow-2xl">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#f9e3dc] text-[#b33f35]"><AlertCircle size={34} /></div>
          <h2 id="help-title" className="font-[Manrope] text-2xl font-extrabold text-[#52352f]">{t.confirmTitle}</h2>
          <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-[#74615b]">{t.confirmText}</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button data-testid="button-cancel-help" onClick={() => setConfirmHelp(false)} className="rounded-2xl border border-[#e5d8d1] px-4 py-4 text-base font-bold text-[#6e645f]">{t.cancel}</button>
            <button data-testid="button-confirm-help" onClick={() => submitCheckin('help')} className="rounded-2xl bg-[#b53d32] px-4 py-4 text-base font-bold text-white">{t.confirm}</button>
          </div>
        </div>
      </div>}
    </main>
  );
}

function ElderView({ dashboard, t, language, success, pending, holding, onFine, onMedicine, onHelpTap, onHelpStart, onHelpStop }: {
  dashboard: NalamDashboard; t: typeof words.en; language: Language; success: NalamCheckinKind | null;
  pending: boolean; holding: boolean; onFine: () => void; onMedicine: () => void; onHelpTap: () => void; onHelpStart: () => void; onHelpStop: () => void;
}) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
  const greet = hour < 12 ? t.morning : hour < 17 ? t.afternoon : t.evening;
  const name = dashboard.elderName || (language === 'ta' ? 'அம்மா' : 'Amma');
  const time = new Date().toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE });
  const last = dashboard.lastCheckIn;

  return <section className="mx-auto max-w-3xl enter">
    <div className="mb-7 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[22px] bg-[#e5eddf] text-[#387352]"><Sparkles size={29} /></div>
      <p className="mb-2 text-sm font-bold uppercase tracking-[.15em] text-[#7d887c]">{time}</p>
      <h1 className="font-[Manrope] text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-tight tracking-[-.05em] text-[#244d39]" data-testid="text-elder-greeting">
        {t.greeting(name, greet)}
      </h1>
      <p className="mt-2 text-lg text-[#718072] sm:text-xl">{t.ready}</p>
    </div>

    <div className="rounded-[30px] border border-[#e6dfce] bg-[#fbf9f2] p-4 shadow-[0_18px_45px_rgba(55,68,49,.08)] sm:p-7">
      {success && <div className="success-pop mb-5 flex flex-col items-center rounded-[22px] bg-[#e4f1e3] px-4 py-5 text-center text-[#286144]" role="status" data-testid="status-checkin-success">
        <div className="mb-2 grid h-14 w-14 place-items-center rounded-full bg-[#398458] text-white"><Check size={34} strokeWidth={3} /></div>
        <div className="text-xl font-extrabold">{success === 'fine' ? t.fineSuccess : success === 'medicine' ? t.medicineSuccess : t.helpSuccess}</div>
        <div className="mt-1 text-sm opacity-80">{t.sent}</div>
      </div>}

      <button data-testid="button-checkin-fine" disabled={pending} onClick={onFine} className="group relative flex min-h-[128px] w-full items-center justify-center gap-4 overflow-hidden rounded-[26px] bg-[#2c754d] px-5 py-6 text-center text-[clamp(1.8rem,6vw,2.65rem)] font-extrabold leading-tight tracking-[-.04em] text-white shadow-[0_7px_0_#205d3c] transition hover:bg-[#266b45] active:translate-y-1 active:shadow-[0_3px_0_#205d3c] disabled:opacity-70 sm:min-h-[148px]" aria-label={language === 'ta' ? 'நான் நலமாக இருக்கிறேன்' : "I'm fine"}>
        {pending ? <LoaderCircle className="animate-spin" size={32} /> : <><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15"><Check size={31} strokeWidth={3} /></span><span>{t.fine}</span></>}
      </button>

      <button data-testid="button-checkin-medicine" disabled={pending} onClick={onMedicine} className="mt-5 flex min-h-[94px] w-full items-center justify-center gap-4 rounded-[24px] border-2 border-[#c6d7c6] bg-[#edf3e9] px-5 py-5 text-center text-[clamp(1.5rem,4.7vw,2rem)] font-extrabold leading-snug tracking-[-.025em] text-[#315c43] transition hover:bg-[#e3eee0] active:scale-[.99] disabled:opacity-70">
        <Pill size={30} strokeWidth={2.4} /><span>{t.medicine}</span>
      </button>

      <button data-testid="button-help" onClick={onHelpTap} onPointerDown={onHelpStart} onPointerUp={onHelpStop} onPointerLeave={onHelpStop} onPointerCancel={onHelpStop} onContextMenu={(event) => event.preventDefault()} className="relative mt-5 min-h-[78px] w-full overflow-hidden rounded-[22px] border-2 border-[#a8322b] bg-[#b53d32] px-5 py-4 text-center text-2xl font-bold text-white transition hover:bg-[#a8322b] active:scale-[.99]">
        {holding && <span className="press-progress absolute inset-y-0 left-0 w-full bg-[#f3d2c9]/70" />}
        <span className="relative inline-flex items-center justify-center gap-3"><AlertCircle size={25} />{holding ? t.hold : t.help}</span>
         <span className="relative mt-1 block text-base font-semibold text-white/90">{t.holdHint}</span>
      </button>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[#e8e2d4] pt-5 text-sm text-[#7b877a] sm:flex-row">
        <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-[#689174]" />{t.privacy}</span>
        {last && <span className="flex items-center gap-2"><Clock3 size={16} />{t.checkedAt} {formatTime(last.createdAt, language)}</span>}
      </div>
    </div>

    <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-[#7c887d]"><Heart size={16} className="text-[#c78e72]" />{t.connected}</div>
  </section>;
}

function FamilyView({ dashboard, t, language }: { dashboard: NalamDashboard; t: typeof words.en; language: Language }) {
  const hasHelp = dashboard.helpRequest || dashboard.status === 'help_requested';
  const missed = !dashboard.lastCheckIn && dashboard.status === 'overdue';
  const checkedIn = !!dashboard.lastCheckIn && !hasHelp;
  const statusClass = hasHelp || missed ? 'bg-[#fff0ec] border-[#edc8bf] text-[#a84035]' : checkedIn ? 'bg-[#e8f2e6] border-[#d2e3d0] text-[#2b6444]' : 'bg-[#fff6df] border-[#ebd9a7] text-[#72571d]';
  const statusTitle = hasHelp ? t.helpNeeded : checkedIn ? t.checked : t.waiting;
  const [contactNumber, setContactNumber] = useState(() => window.localStorage.getItem('nalam-contact-number') ?? '');
  const dialableNumber = contactNumber.replace(/[^\d+]/g, '');
  const setContact = (value: string) => {
    setContactNumber(value);
    window.localStorage.setItem('nalam-contact-number', value);
  };
  const days = useMemo(() => {
    const now = new Date(`${dateKey(new Date())}T12:00:00+05:30`);
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(now);
      date.setUTCDate(now.getUTCDate() - i);
      const key = dateKey(date);
      return { date, key, label: i === 0 ? t.dateToday : i === 1 ? t.yesterday : t.daysAgo(i) };
    });
  }, [t]);
  const events = dashboard.timeline ?? [];
  const todayEvents = events.filter((event) => isSameDay(event.createdAt, new Date()));
  const medicine = dashboard.lastMedicine;

  return <section className="enter">
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[.14em] text-[#819080]"><UsersRound size={16} /> {t.family}</div>
        <h1 className="font-[Manrope] text-3xl font-extrabold tracking-[-.045em] text-[#244b3a] sm:text-4xl">{t.familyTitle}</h1>
        <p className="mt-2 text-[#778378]">{t.familySub}</p>
      </div>
      <div className="flex items-center gap-2 self-start rounded-full border border-[#dfdacb] bg-[#fbf9f2] px-3 py-2 text-xs font-semibold text-[#6b796c] sm:self-auto"><Bell size={15} /> {t.live}</div>
    </div>

    <div className={`mb-6 rounded-[28px] border p-5 sm:p-7 ${statusClass}`} data-testid="status-family">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${hasHelp ? 'bg-[#c84c3e] text-white' : missed ? 'bg-[#e4bd5f] text-[#553f15]' : 'bg-[#4f9367] text-white'}`}>
            {hasHelp || missed ? <AlertCircle size={29} /> : !checkedIn ? <Clock3 size={28} /> : <CheckCircle2 size={30} />}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[.15em] opacity-70">{t.status}</div>
            <h2 className="mt-1 font-[Manrope] text-2xl font-extrabold tracking-[-.03em] sm:text-3xl" data-testid="text-live-status">{statusTitle}</h2>
            <p className="mt-1 text-sm opacity-80">{dashboard.elderName}</p>
          </div>
        </div>
        <div className="flex gap-6 sm:gap-8">
          <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider opacity-65">{t.expected}</div><div className="text-lg font-bold">{formatExpectedTime(dashboard.expectedTime, language)}</div></div>
          {dashboard.lastCheckIn && <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider opacity-65">{t.checkedAt}</div><div className="text-lg font-bold">{formatTime(dashboard.lastCheckIn.createdAt, language)}</div></div>}
        </div>
      </div>
      {(hasHelp || missed) && <div className="mt-5 flex flex-col gap-3 border-t border-current/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold">{hasHelp ? t.helpNeeded : t.waiting}</span>
        <div className="flex flex-col gap-2 sm:min-w-72">
          <label className="text-xs font-semibold opacity-80" htmlFor="family-contact">{t.contactLabel}</label>
          <input id="family-contact" data-testid="input-family-contact" type="tel" inputMode="tel" autoComplete="tel" value={contactNumber} onChange={(event) => setContact(event.target.value)} placeholder={t.contactPlaceholder} className="min-h-11 rounded-xl border border-current/20 bg-white/80 px-3 text-sm text-[#3e5142] placeholder:text-[#8a9588] focus:outline-none focus:ring-2 focus:ring-[#598a68]" />
          <div className="flex gap-3">
            <a data-testid="link-call-elder" href={dialableNumber ? `tel:${dialableNumber}` : undefined} aria-disabled={!dialableNumber} className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white no-underline transition sm:flex-none ${dialableNumber ? 'bg-[#b84337] hover:bg-[#a83c31]' : 'cursor-not-allowed bg-[#b7a49e]'}`}><Phone size={17} />{t.call}</a>
            <a data-testid="link-message-elder" href={dialableNumber ? `sms:${dialableNumber}` : undefined} aria-disabled={!dialableNumber} className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-current/20 px-4 text-sm font-bold no-underline transition sm:flex-none ${dialableNumber ? 'bg-white/60 text-current hover:bg-white/90' : 'cursor-not-allowed bg-white/40 text-current/55'}`}><MessageCircle size={17} />{t.message}</a>
          </div>
          {!dialableNumber && <span className="text-xs opacity-75">{t.contactHint}</span>}
        </div>
      </div>}
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.45fr_.85fr]">
      <section className="rounded-[26px] border border-[#e5dfcf] bg-[#fbf9f2] p-5 shadow-[0_12px_35px_rgba(55,68,49,.05)] sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-[Manrope] text-xl font-extrabold tracking-[-.03em] text-[#31543e]">{t.timeline}</h2>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9efe3] text-[#557b5e]"><CalendarDays size={18} /></div>
        </div>
        {todayEvents.length ? <div className="relative ml-3 space-y-4 border-l-2 border-[#dce5d8] pl-6">
          {todayEvents.map((event) => <TimelineItem key={event.id} event={event} language={language} />)}
        </div> : <div className="rounded-2xl bg-[#f2f1e8] px-4 py-5 text-sm text-[#7b8679]">{t.noEvents}</div>}
      </section>

      <section className="rounded-[26px] border border-[#e5dfcf] bg-[#fbf9f2] p-5 shadow-[0_12px_35px_rgba(55,68,49,.05)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[Manrope] text-xl font-extrabold tracking-[-.03em] text-[#31543e]">{t.medicineTitle}</h2>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f4eddb] text-[#8b7141]"><Pill size={18} /></div>
        </div>
        {medicine ? <div className="flex items-center gap-3 rounded-2xl bg-[#eaf2e7] p-4 text-[#315d42]" data-testid="status-medicine">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#4f9367] text-white"><Check size={22} /></span>
          <div><div className="font-bold">{t.medicineTaken}</div><div className="mt-0.5 text-sm opacity-75">{formatTime(medicine.createdAt, language)}</div></div>
        </div> : <div className="rounded-2xl bg-[#f2f1e8] p-4 text-sm leading-relaxed text-[#778176]" data-testid="status-medicine">{t.medicineWaiting}</div>}
        <div className="mt-5 border-t border-[#ebe6d8] pt-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-[#849081]">{t.history}</div>
          <div className="space-y-2">
            {days.map(({ date, key, label }, i) => {
              const dayEvents = events.filter((event) => dateKey(new Date(event.createdAt)) === key);
              return <div key={key} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 odd:bg-[#f4f2e9]" data-testid={`history-day-${i}`}>
                <div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${dayEvents.length ? 'bg-[#62a073]' : 'bg-[#d9d7cb]'}`} /><span className="text-sm font-semibold text-[#57675a]">{label}</span></div>
                <div className="flex items-center gap-2 text-xs text-[#7c8778]">{dayEvents.length ? <><span>{dayEvents.length} {dayEvents.length === 1 ? 'update' : 'updates'}</span>{dayEvents.some((item) => item.sample) && <span className="rounded-full bg-[#e9e2cd] px-2 py-0.5">{t.sample}</span>}</> : <span>{t.noEvents}</span>}<ChevronRight size={14} /></div>
              </div>;
            })}
          </div>
        </div>
      </section>
    </div>
  </section>;
}

function TimelineItem({ event, language }: { event: NalamCheckin; language: Language }) {
  const detail = event.kind === 'fine'
    ? language === 'ta' ? 'நான் நலமாக இருக்கிறேன்' : 'Feeling well'
    : event.kind === 'medicine'
      ? language === 'ta' ? 'மருந்து எடுத்துவிட்டேன்' : 'Medicine taken'
      : language === 'ta' ? 'உதவி கோரிக்கை' : 'Help requested';
  const color = event.kind === 'help' ? 'bg-[#c34c40]' : event.kind === 'medicine' ? 'bg-[#d3a94f]' : 'bg-[#58a06c]';
  return <div className="relative flex items-center justify-between gap-3" data-testid={`timeline-event-${event.id}`}>
    <span className={`absolute -left-[31px] grid h-4 w-4 place-items-center rounded-full border-[3px] border-[#fbf9f2] ${color}`} />
    <span className="text-sm font-semibold text-[#506353]">{detail}{event.sample && <span className="ml-2 rounded-full bg-[#eee8d7] px-2 py-0.5 text-[10px] font-bold text-[#8a7954]">sample</span>}</span>
    <time className="whitespace-nowrap text-xs font-medium text-[#899187]">{formatTime(event.createdAt, language)}</time>
  </div>;
}

function Loading({ t }: { t: typeof words.en }) {
  return <main className="app-shell min-h-[100dvh] px-5 py-8">
    <div className="mx-auto max-w-5xl animate-pulse">
      <div className="mb-9 flex items-center gap-3"><div className="h-12 w-12 rounded-2xl bg-[#e1dfd1]" /><div><div className="h-6 w-28 rounded bg-[#e1dfd1]" /><div className="mt-2 h-3 w-40 rounded bg-[#e8e5d9]" /></div></div>
      <div className="mx-auto max-w-2xl rounded-[30px] border border-[#e4dfd1] bg-[#fbf9f2] p-7 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-[#e5e9dc]" /><div className="mx-auto mt-5 h-9 w-2/3 rounded bg-[#e4e2d6]" />
        <div className="mt-8 h-32 rounded-3xl bg-[#e1e9dc]" /><div className="mt-5 h-24 rounded-3xl bg-[#eceee5]" />
        <p className="mt-6 text-sm font-medium text-[#748174]">{t.loading}</p>
      </div>
    </div>
  </main>;
}

function ErrorScreen({ message, retry, retryLabel }: { message: string; retry: () => void; retryLabel: string }) {
  return <main className="app-shell grid min-h-[100dvh] place-items-center px-5">
    <div className="w-full max-w-md rounded-[28px] border border-[#e5dfcf] bg-[#fbf9f2] p-8 text-center shadow-sm" role="alert">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f9e5de] text-[#aa4439]"><AlertCircle size={28} /></div>
      <h1 className="font-[Manrope] text-xl font-extrabold text-[#354e3b]">{message}</h1>
      <button data-testid="button-retry-dashboard" onClick={retry} className="mt-6 rounded-xl bg-[#2d714a] px-5 py-3 font-bold text-white">{retryLabel}</button>
    </div>
  </main>;
}

function formatExpectedTime(time: string, language: Language) {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return time || '—';
  let hour = Number(match[1]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  const date = new Date(Date.UTC(2026, 0, 1, hour, Number(match[2])));
  return date.toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

function formatTime(value: string, language: Language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE });
}

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (kind: string) => parts.find((entry) => entry.type === kind)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function isSameDay(value: string, date: Date) { return dateKey(new Date(value)) === dateKey(date); }

function App() {
  return <QueryClientProvider client={queryClient}><AppContent /></QueryClientProvider>;
}

export default App;
