import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users,
  Layout,
  Sparkles,
  ImageUp,
  PencilRuler,
  ChevronLeft,
  Minus,
  Plus,
  Check,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ColorSelector } from '@/components/color/ColorSelector';
import { useColorTheme, COLOR_THEMES } from '@/contexts/ColorThemeContext';
import { useSeatingData } from '@/contexts/SeatingDataContext';
import { useToast } from '@/hooks/use-toast';
import { clamp } from '@/lib/utils';
import { TABLE_SPECIFICATIONS } from '@/types/seating';
import { safeLocalStorage } from '@/lib/safeStorage';

const AUTO_ROTATE_INTERVAL_MS = 10_000;
const SHAKE_DURATION_MS = 600;
const SLIDE_DURATION_MS = 600;

type Stage = 'color' | 'resume' | 'starting-point' | 'upload-question' | 'quick-setup';
type QuickSetupMode = 'guests' | 'tables';

const SIXTY_INCH_ROUND = TABLE_SPECIFICATIONS.find(
  (s) => s.shape === 'round' && s.size === '60" diameter',
)!;

const SEATS_PER_TABLE = SIXTY_INCH_ROUND.defaultChairs;
const MIN_GUESTS = 1;
const MAX_GUESTS = 500;
const MIN_TABLES = 1;
const MAX_TABLES = 60;
const DEFAULT_GUESTS = 80;
const DEFAULT_TABLES = 10;

const GUEST_PRESETS = [50, 100, 150, 200];
const TABLE_PRESETS = [6, 10, 15, 20];

/** Place N round tables in a centered grid inside the default 800x600 canvas. */
const buildTableGridPositions = (count: number) => {
  const cols = Math.min(5, Math.max(3, Math.ceil(Math.sqrt(count))));
  const spacing = 130;
  const rows = Math.ceil(count / cols);
  const startX = 400 - ((cols - 1) * spacing) / 2;
  const startY = 300 - ((rows - 1) * spacing) / 2;
  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return { x: startX + col * spacing, y: startY + row * spacing };
  });
};

const Index = () => {
  const { isAnimating, selectedTheme, setSelectedTheme } = useColorTheme();
  const seatingCtx = useSeatingData();
  const { loadDemoData, addTables } = seatingCtx;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [autoRotating, setAutoRotating] = useState(true);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [stage, setStage] = useState<Stage>('color');
  const [shaking, setShaking] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [quickMode, setQuickMode] = useState<QuickSetupMode>('guests');
  const [guestCount, setGuestCount] = useState(DEFAULT_GUESTS);
  const [tableCount, setTableCount] = useState(DEFAULT_TABLES);
  const themeIndexRef = useRef(
    Math.max(
      COLOR_THEMES.findIndex((t) => t.name === selectedTheme.name),
      0,
    ),
  );

  useEffect(() => {
    if (!autoRotating || hoverPaused) return;

    const id = setInterval(() => {
      themeIndexRef.current = (themeIndexRef.current + 1) % COLOR_THEMES.length;
      setSelectedTheme(COLOR_THEMES[themeIndexRef.current]);
    }, AUTO_ROTATE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [autoRotating, hoverPaused, setSelectedTheme]);

  const hasExistingProject = useMemo(() => {
    const { seatingData, assets } = seatingCtx;
    return (
      seatingData.tables.length > 0 || seatingData.unassignedGuests.length > 0 || assets.length > 0
    );
  }, [seatingCtx]);

  const handleColorPick = useCallback(() => {
    setAutoRotating(false);
    setSliding(true);
    setTimeout(() => {
      setStage(hasExistingProject ? 'resume' : 'starting-point');
      setSliding(false);
    }, SLIDE_DURATION_MS);
  }, [hasExistingProject]);

  /** Shake the current stage, then slide it out and switch to the next stage. */
  const shakeAndTransition = useCallback((nextStage: Stage) => {
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      setSliding(true);
      setTimeout(() => {
        setStage(nextStage);
        setSliding(false);
      }, SLIDE_DURATION_MS);
    }, SHAKE_DURATION_MS);
  }, []);

  const handleStartFresh = useCallback(() => {
    safeLocalStorage.clear();
    window.location.reload();
  }, []);

  const handleTryDemo = () => {
    loadDemoData();
    toast({
      title: 'Demo data loaded',
      description: 'Explore with 28 sample guests, 4 tables, and 14 families.',
    });
    navigate('/room-layout');
  };

  const tablesNeededFromGuests = useMemo(
    () => Math.max(1, Math.ceil(guestCount / SEATS_PER_TABLE)),
    [guestCount],
  );

  const handleConfirmQuickSetup = () => {
    const count = quickMode === 'guests' ? tablesNeededFromGuests : tableCount;
    const positions = buildTableGridPositions(count);
    addTables(
      positions.map((pos) => ({
        x: pos.x,
        y: pos.y,
        shape: SIXTY_INCH_ROUND.shape,
        capacity: SIXTY_INCH_ROUND.defaultChairs,
        guests: [],
        tableSize: SIXTY_INCH_ROUND.size,
        commonUse: SIXTY_INCH_ROUND.commonUse,
        defaultChairs: SIXTY_INCH_ROUND.defaultChairs,
        maxChairs: SIXTY_INCH_ROUND.maxChairs,
      })),
    );
    toast({
      title: `${count} table${count === 1 ? '' : 's'} added`,
      description:
        quickMode === 'guests'
          ? `Seats ${count * SEATS_PER_TABLE} (you said ~${guestCount} guests)`
          : `Each 60" round seats ${SEATS_PER_TABLE}`,
    });
    navigate('/room-layout');
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 pt-16 md:pt-24">
      <div className="mx-auto max-w-4xl space-y-12 text-center">
        {/* Hero Title Section */}
        <div className={stage === 'color' ? 'space-y-4' : 'space-y-2'}>
          <h1
            className={`font-playfair text-primary text-6xl font-black transition-all duration-500 ease-in-out md:text-7xl lg:text-8xl ${isAnimating ? 'animate-glow-pulse animate-color-morph' : ''} `}
            style={{
              textShadow: isAnimating ? '0 0 30px rgba(var(--primary-rgb), 0.4)' : undefined,
            }}
          >
            It's YOUR day.
          </h1>

          {stage === 'color' && (
            <>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg tracking-wide md:text-xl">
                A visual table layout and seating planner
              </p>

              <p className="text-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed font-medium md:text-xl">
                Arrange your tables. Seat your guests. See your vision come to life!
              </p>
            </>
          )}
        </div>

        {/* Staged content area — fixed height prevents layout shift during transition */}
        <div className="relative min-h-[360px]">
          {/* Stage 1: Color Selector */}
          {stage === 'color' && (
            <div
              className={`space-y-6 transition-all duration-700 ease-in-out ${
                sliding
                  ? '-translate-x-full scale-95 opacity-0'
                  : 'translate-x-0 scale-100 opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={handleColorPick}
                className="block w-full appearance-none border-0 bg-transparent p-0 text-left"
              >
                <ColorSelector onHoveringChange={setHoverPaused} />
              </button>
            </div>
          )}

          {/* Stage: Resume existing project */}
          {stage === 'resume' && (
            <div className="animate-slide-in-right space-y-8">
              <div className="space-y-2">
                <h2 className="font-playfair text-foreground text-3xl font-bold md:text-4xl">
                  Welcome back!
                </h2>
                <p className="text-muted-foreground mx-auto max-w-md text-base">
                  It looks like you already have a project in progress.
                </p>
              </div>

              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate('/room-layout')}
                  className="group bg-primary hover:bg-primary/90 text-primary-foreground flex h-28 w-full flex-col items-center justify-center gap-3 rounded-xl px-8 text-lg shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <ArrowRight className="h-7 w-7 transition-transform group-hover:translate-x-1" />
                  <span className="font-semibold">Resume my project</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartFresh}
                  className="group border-border bg-card hover:border-destructive/50 hover:bg-destructive/5 flex h-28 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 px-8 text-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <RefreshCw className="text-muted-foreground h-7 w-7 transition-transform group-hover:rotate-180 group-hover:duration-500" />
                  <span className="text-foreground font-semibold">Start fresh</span>
                </button>
              </div>
            </div>
          )}

          {/* Stage 2: Starting point */}
          {stage === 'starting-point' && (
            <div
              className={`space-y-8 ${
                shaking
                  ? 'animate-exit-shake'
                  : sliding
                    ? '-translate-x-full scale-95 opacity-0 transition-all duration-700 ease-in-out'
                    : 'animate-slide-in-right'
              }`}
            >
              <div>
                <h2 className="text-foreground text-xl font-semibold">Pick your starting point</h2>
              </div>

              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => shakeAndTransition('upload-question')}
                  className="group bg-primary hover:bg-primary/90 text-primary-foreground flex h-24 w-full items-center justify-center rounded-lg px-8 text-lg shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Layout className="h-8 w-8 transition-transform group-hover:scale-110" />
                    <span className="font-semibold">Design my room</span>
                  </div>
                </button>

                <Link to="/guest-management" className="group">
                  <Button
                    size="lg"
                    variant="outline"
                    className="hover:bg-primary/5 hover:text-foreground hover:border-primary h-24 w-full border-2 px-8 text-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Users className="text-primary h-8 w-8 transition-transform group-hover:scale-110" />
                      <span className="text-foreground font-semibold">Start my guest list</span>
                    </div>
                  </Button>
                </Link>
              </div>

              {/* Alt entry point: opt-in demo data for first-time visitors */}
              <div className="mx-auto max-w-md">
                <div className="text-muted-foreground mb-3 text-sm">
                  Just exploring? Load a sample event to play with.
                </div>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={handleTryDemo}
                  className="hover:bg-primary/5 hover:text-primary group border-input text-foreground h-14 w-full border border-dashed px-6 text-base transition-all duration-300"
                >
                  <Sparkles className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Try it with Demo Data!</span>
                </Button>
              </div>
            </div>
          )}

          {/* Stage 3: Upload-or-not question */}
          {stage === 'upload-question' && (
            <div
              className={`space-y-8 ${
                shaking
                  ? 'animate-exit-shake'
                  : sliding
                    ? '-translate-x-full scale-95 opacity-0 transition-all duration-700 ease-in-out'
                    : 'animate-slide-in-right'
              }`}
            >
              <div className="space-y-2">
                <h2 className="font-playfair text-foreground text-3xl font-bold md:text-4xl">
                  How do you want to start?
                </h2>
              </div>

              <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => navigate('/room-setup')}
                  className="group border-primary/20 hover:border-primary hover:bg-primary/5 bg-card flex h-40 flex-col items-center justify-center gap-3 rounded-xl border-2 px-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="bg-primary/10 group-hover:bg-primary/20 rounded-full p-3 transition-colors">
                    <ImageUp className="text-primary h-7 w-7" />
                  </div>
                  <div className="text-center">
                    <div className="text-foreground text-base font-semibold">Upload floor plan</div>
                    <div className="text-muted-foreground mt-1 text-xs">JPEG, PNG, or WebP</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => shakeAndTransition('quick-setup')}
                  className="group border-border bg-card hover:border-muted-foreground flex h-40 flex-col items-center justify-center gap-3 rounded-xl border-2 px-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="bg-muted group-hover:bg-muted/80 rounded-full p-3 transition-colors">
                    <PencilRuler className="text-foreground h-7 w-7" />
                  </div>
                  <div className="text-center">
                    <div className="text-foreground text-base font-semibold">Estimate tables</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      By guest or table count
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/room-layout')}
                  className="group border-border bg-card hover:border-muted-foreground flex h-40 flex-col items-center justify-center gap-3 rounded-xl border-2 px-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="bg-muted group-hover:bg-muted/80 rounded-full p-3 transition-colors">
                    <Layout className="text-foreground h-7 w-7" />
                  </div>
                  <div className="text-center">
                    <div className="text-foreground text-base font-semibold">
                      Start from scratch
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">Blank canvas</div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStage('starting-point')}
                className="hover:text-primary text-muted-foreground mx-auto inline-flex items-center gap-1 text-sm transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          )}

          {/* Stage 4: Quick setup (no-photo flow) */}
          {stage === 'quick-setup' && (
            <div className="animate-slide-in-right space-y-8">
              <div className="space-y-2">
                <h2 className="font-playfair text-foreground text-3xl font-bold md:text-4xl">
                  Quick setup
                </h2>
                <p className="text-muted-foreground mx-auto max-w-xl text-base">
                  We'll add{' '}
                  <span className="text-foreground font-semibold">60&quot; round tables</span>{' '}
                  (seats {SEATS_PER_TABLE}) so you can start placing them right away.
                </p>
              </div>

              {/* Mode toggle */}
              <div
                className="border-border bg-muted/50 mx-auto inline-flex rounded-full border p-1 shadow-sm"
                role="tablist"
                aria-label="Quick setup mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={quickMode === 'guests'}
                  onClick={() => setQuickMode('guests')}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                    quickMode === 'guests'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  By guest count
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={quickMode === 'tables'}
                  onClick={() => setQuickMode('tables')}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                    quickMode === 'tables'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  By table count
                </button>
              </div>

              {/* Stepper card */}
              <div className="border-primary/10 bg-card mx-auto max-w-md rounded-2xl border p-6 shadow-xl">
                {quickMode === 'guests' ? (
                  <QuickStepper
                    label="Guests"
                    value={guestCount}
                    min={MIN_GUESTS}
                    max={MAX_GUESTS}
                    step={5}
                    presets={GUEST_PRESETS}
                    onChange={setGuestCount}
                  />
                ) : (
                  <QuickStepper
                    label="Tables"
                    value={tableCount}
                    min={MIN_TABLES}
                    max={MAX_TABLES}
                    step={1}
                    presets={TABLE_PRESETS}
                    onChange={setTableCount}
                  />
                )}

                <div className="border-border/60 text-muted-foreground mt-5 border-t pt-4 text-sm">
                  {quickMode === 'guests' ? (
                    <>
                      <span className="text-primary font-semibold">
                        {tablesNeededFromGuests} table{tablesNeededFromGuests === 1 ? '' : 's'}
                      </span>{' '}
                      will be added{' '}
                      <span className="text-muted-foreground/70">
                        ({tablesNeededFromGuests * SEATS_PER_TABLE} seats total)
                      </span>
                    </>
                  ) : (
                    <>
                      Seats up to{' '}
                      <span className="text-primary font-semibold">
                        {tableCount * SEATS_PER_TABLE} guests
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  onClick={handleConfirmQuickSetup}
                  className="bg-primary hover:bg-primary/90 h-12 px-8 text-base shadow-lg transition-all hover:scale-[1.02]"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Add tables &amp; start designing
                </Button>
                <button
                  type="button"
                  onClick={() => setStage('upload-question')}
                  className="hover:text-primary text-muted-foreground inline-flex items-center gap-1 text-sm transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface QuickStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  presets: number[];
  onChange: (next: number) => void;
}

const QuickStepper = ({ label, value, min, max, step, presets, onChange }: QuickStepperProps) => {
  return (
    <div className="space-y-4">
      <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </div>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => onChange(clamp(value - step, min, max))}
          disabled={value <= min}
          className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-5 w-5" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n)) onChange(clamp(n, min, max));
          }}
          className="font-playfair text-primary w-28 [appearance:textfield] bg-transparent text-center text-5xl font-bold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(clamp(value + step, min, max))}
          disabled={value >= max}
          className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              value === p
                ? 'bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-input border'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Index;
