import React, { useState, useEffect, useRef } from 'react';
import StockViewer from './stockviewerreact';

export default function MarketSimReact() {
  // Game states
  const [week, setWeek] = useState(1);
  const targetNav = 7_500_000;
  const [cash, setCash] = useState(1_200_000);
  const [lpConfidence, setLpConfidence] = useState(75);
  const weeklyOverhead = 35_000;

  const [portfolio, setPortfolio] = useState({
    HCKSOC: { shares: 35_000, price: 40.0 },
    CAPONE: { shares: 20_000, price: 70.0 },
    TELLUV: { shares: 40_000, price: 25.0 },
  });

  const [crashTriggered, setCrashTriggered] = useState(false);
  const [crashWeek] = useState(() => Math.floor(Math.random() * (14 - 11 + 1)) + 11);
  const [eventsTriggered, setEventsTriggered] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);

  // Price history for syncing with Stock Viewer
  const [history, setHistory] = useState({
    weeks: [1],
    HCKSOC: [40.0],
    CAPONE: [70.0],
    TELLUV: [25.0],
  });

  // UI state
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [inputCommand, setInputCommand] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // { action: 'BUY'|'SELL', step: 'TICKER'|'QTY', payload: {} }
  const [isInputDisabled, setIsInputDisabled] = useState(true);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [activeNewsModal, setActiveNewsModal] = useState(null); // { headline, body, callback }

  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  // Helper to append log lines
  const writeLine = (text, tag = null) => {
    setTerminalLogs((prev) => [...prev, { id: Math.random(), text, tag }]);
  };

  // Scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Calculate current portfolio NAV
  const getPortfolioValue = (currentPort = portfolio, currentCash = cash) => {
    const holdings = Object.values(currentPort).reduce(
      (sum, item) => sum + item.shares * item.price,
      0
    );
    return currentCash + holdings;
  };

  // Print startup sequence on mount
  useEffect(() => {
    const steps = [
      { delay: 50, text: '>> PHOENIX BIOS 4.06 REV 1.04-Y2K', tag: 'dim' },
      { delay: 100, text: 'Copyright (C) 1985-1999 Nottingham Micro Systems, Inc.', tag: 'dim' },
      { delay: 200, text: 'CPU: DEC Alpha 21264 @ 667 MHz  |  64-BIT RISC ARCHITECTURE', tag: 'dim' },
      { delay: 350, text: 'CHECKING SYSTEM MEMORY: 524288KB OK', tag: 'dim' },
      { delay: 500, text: 'PRIMARY MASTER: QUANTUM FIREBALL 20.4 GB IDE [DMA MODE 4]', tag: 'dim' },
      { delay: 700, text: 'INITIALIZING V.90 56K DIAL-UP MODEM ON COM2...', tag: 'dim' },
      { delay: 950, text: 'DIALING: ATDT 1-800-WALLSTREET... CONNECT 56000/ARQ/V90/LAPM', tag: 'cyan' },
      { delay: 1200, text: '[!] Y2K COMPLIANCE INTEGRITY AUDIT IN PROGRESS...', tag: 'amber' },
      { delay: 1450, text: '    RTC ROLLOVER CLOCK: 23:59:58 31-DEC-1999 -> 00:00:00 01-JAN-2000', tag: 'dim' },
      { delay: 1700, text: '    COBOL-74 LEGACY PARSER: [PATCHED / STRICT_4DIGIT_YEAR]', tag: 'dim' },
      { delay: 1950, text: '    MILLENNIUM BUG WATCHDOG DAEMON: ACTIVE [CONFIDENCE 80%]', tag: 'amber' },
      { delay: 2200, text: 'AUTHENTICATING TO NY-FIX BRIDGE (PORT 443)... HANDSHAKE OK', tag: 'cyan' },
      { delay: 2500, text: 'SECURITIES & EXCHANGE AUTOMATION: INITIALIZED', tag: 'dim' },
      { delay: 2800, text: 'READY.\n', tag: 'highlight' },
    ];

    const timers = [];
    steps.forEach(({ delay, text, tag }) => {
      const t = setTimeout(() => writeLine(text, tag), delay);
      timers.push(t);
    });

    const finishBootTimer = setTimeout(() => {
      printWelcome();
      displayDashboard(1, cash, lpConfidence, portfolio);
      setIsInputDisabled(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, 3100);
    timers.push(finishBootTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  const printWelcome = () => {
    const banner = `==========================================================================
 _   _  ____ _______ _______ _____ _   _  _____ _    _          __  __ 
| \\ | |/ __ \\__   __|__   __|_   _| \\ | |/ ____| |  | |   /\\   |  \\/  |
|  \\| | |  | | | |     | |    | | |  \\| | |  __| |__| |  /  \\  | \\  / |
| . \` | |  | | | |     | |    | | | . \` | | |_ |  __  | / /\\ \\ | |\\/| |
| |\\  | |__| | | |     | |   _| |_| |\\  | |__| | |  | |/ ____ \\| |  | |
|_| \\_|\\____/  |_|     |_|  |_____|_| \\_|\\_____|_|  |_/_/    \\_\\_|  |_|
                     NOTTINGHAM INVESTMENT FUND           
==========================================================================`;
    writeLine(banner, 'dim');
    writeLine('[!] SYSTEM CLOCK: DEC 1999. PRE-CRASH SURVEILLANCE RUNNING.', 'amber');
  };

  const displayDashboard = (
    currentWeek = week,
    currentCash = cash,
    currentConf = lpConfidence,
    currentPort = portfolio
  ) => {
    const nav = getPortfolioValue(currentPort, currentCash);
    writeLine('\n' + '='.repeat(66), 'dim');
    writeLine(
      ` BLEEMBORG INTELLIGENCE TERMINAL v2.4  |  WEEK ${String(currentWeek).padStart(2, '0')} / 24`,
      'amber'
    );
    writeLine(
      ` PORTFOLIO NAV : $${nav.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  |  TARGET: $${targetNav.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      nav >= targetNav ? 'highlight' : 'amber'
    );
    writeLine(
      ` CASH AVAILABLE : $${currentCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  |  LP CONFIDENCE : ${currentConf}%`,
      null
    );
    writeLine(
      ` FIXED OPERATING OVERHEAD : -$${weeklyOverhead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / WEEK`,
      'dim'
    );
    writeLine('-'.repeat(66), 'dim');

    const pad = (str, len) => (str + ' '.repeat(len)).slice(0, len);
    writeLine(
      `${pad('TICKER', 10)} ${pad('PRICE', 12)} ${pad('SHARES', 12)} ${pad('TOTAL VALUE', 14)}`,
      'highlight'
    );

    Object.entries(currentPort).forEach(([ticker, data]) => {
      const val = data.shares * data.price;
      writeLine(
        `${pad(ticker, 10)} ${pad(`$${data.price.toFixed(2)}`, 12)} ${pad(String(data.shares), 12)} $${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        null
      );
    });
    writeLine('='.repeat(66), 'dim');

    if (!checkGameOver(nav, currentConf)) {
      writeLine(
        '\nOPTIONS: [1] BUY  [2] SELL  [3] REASSURE LPs ($150k)  [4] ADVANCE WEEK  [5] EXIT  [6] VIEW STOCKS',
        'amber'
      );
    }
  };

  const checkGameOver = (currentNav = getPortfolioValue(), currentConf = lpConfidence) => {
    if (currentConf <= 0 || currentNav <= 1_200_000) {
      writeLine('\n' + '!'.repeat(66), 'alert');
      writeLine('[!] LIQUIDATION NOTICE: Limited partners pulled all capital. Fund insolvent.', 'alert');
      writeLine(
        `[!] FINAL NAV AT COLLAPSE: $${currentNav.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  |  CONFIDENCE: ${currentConf}%`,
        'alert'
      );
      writeLine('!'.repeat(66), 'alert');
      setGameOver(true);
      setIsInputDisabled(true);
      return true;
    }
    return false;
  };

  const endGame = (finalNav = getPortfolioValue()) => {
    writeLine('\n' + '='.repeat(66), 'amber');
    writeLine('=== Q4 ANNUAL AUDIT // FINAL PERFORMANCE RESULT ===', 'amber');
    writeLine('='.repeat(66), 'dim');
    writeLine(
      `Final NAV: $${finalNav.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  |  Target Requirement: $${targetNav.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );
    if (finalNav >= targetNav && lpConfidence > 0) {
      writeLine('STATUS: SURVIVOR & ALPHA PRODUCER.', 'highlight');
      writeLine('You timed the bubble, managed capital reserves, and beat Wall Street benchmarks!', 'highlight');
    } else {
      writeLine('STATUS: INSOLVENT / BENCHMARK FAILED.', 'alert');
      writeLine('The fund failed to beat LP hurdle rates or collapsed under the bubble burst.', 'alert');
    }
    setGameOver(true);
    setIsInputDisabled(true);
  };

  const checkNewsEvents = (targetWeek, newPort, newCash, newConf) => {
    // 1. Crash simulation
    if (targetWeek === crashWeek && !crashTriggered) {
      setCrashTriggered(true);
      const updatedPort = {
        HCKSOC: { ...newPort.HCKSOC, price: Math.max(0.5, +(newPort.HCKSOC.price * 0.28).toFixed(2)) },
        CAPONE: { ...newPort.CAPONE, price: Math.max(1.0, +(newPort.CAPONE.price * 0.38).toFixed(2)) },
        TELLUV: { ...newPort.TELLUV, price: Math.max(5.0, +(newPort.TELLUV.price * 0.8).toFixed(2)) },
      };
      const updatedConf = Math.max(0, newConf - 25);
      setPortfolio(updatedPort);
      setLpConfidence(updatedConf);

      // Sync history
      setHistory((prev) => ({
        ...prev,
        HCKSOC: [...prev.HCKSOC.slice(0, -1), updatedPort.HCKSOC.price],
        CAPONE: [...prev.CAPONE.slice(0, -1), updatedPort.CAPONE.price],
        TELLUV: [...prev.TELLUV.slice(0, -1), updatedPort.TELLUV.price],
      }));

      const headline = "FEDERAL RESERVE EMERGENCY ADDRESS: 'IRRATIONAL EXUBERANCE'";
      const body = [
        "WASHINGTON - In an unscheduled symposium, Federal Reserve leadership issued an unprecedented warning against unsustainable valuations in dot-com equities.",
        "Liquidity across secondary markets has seized up. Tech speculative darlings HCKSOC (-72%) and CAPONE (-62%) have suffered catastrophic collapse, while defensive utility TELLUV cushioned with only -20%.",
        `Limited Partners have initiated emergency margin reviews. Fund confidence has plunged to ${updatedConf}%.`,
        "Trading desks report widespread failure-to-deliver errors across clearing houses. Will you cut losses, hold, or risk buying the blood in the streets?",
      ];

      setActiveNewsModal({
        headline,
        body,
        onDismiss: () => {
          writeLine("\n>>> BREAKING: FED CHAIR WARNS OF 'IRRATIONAL EXUBERANCE'. TECH BUBBLE BURSTS.", 'alert');
          writeLine(`[ALERT] PANIC LIQUIDATION: LP CONFIDENCE DROPPED TO ${updatedConf}%\n`, 'alert');
          displayDashboard(targetWeek, newCash, updatedConf, updatedPort);
        },
      });
      return;
    }

    // 2. Specific news pool events (weeks 5, 9, 17)
    if ([5, 9, 17].includes(targetWeek) && !eventsTriggered.has(targetWeek)) {
      setEventsTriggered((prev) => new Set(prev).add(targetWeek));
      const eventPool = {
        5: {
          headline: 'CAPONE ANNOUNCES RECORD B2B CREDIT SURGE & NASDAQ EXPANSION',
          ticker: 'CAPONE',
          mult: 1.25,
          confDelta: 5,
          desc: 'Credit facility demands from venture-backed startups surge. CAPONE shares surge +25% on massive institutional volume.',
        },
        9: {
          headline: 'DOJ LAUNCHES ANTITRUST PROBE INTO HCKSOC CODE DISTRIBUTION',
          ticker: 'HCKSOC',
          mult: 0.78,
          confDelta: -5,
          desc: 'Federal regulators issue subpoenas regarding proprietary software tie-ins. HCKSOC slides -22% amid intense short seller interest.',
        },
        17: {
          headline: 'INSTITUTIONAL ROTATION: DEFENSIVE FIBER DEMAND BOOSTS TELLUV',
          ticker: 'TELLUV',
          mult: 1.2,
          confDelta: 5,
          desc: 'Global telecommunication syndication agreements finalized. TELLUV surges +20% as risk-averse capital rotates into infrastructure.',
        },
      };

      const ev = eventPool[targetWeek];
      if (ev) {
        const updatedPrice = Math.max(0.5, +(newPort[ev.ticker].price * ev.mult).toFixed(2));
        const updatedPort = {
          ...newPort,
          [ev.ticker]: { ...newPort[ev.ticker], price: updatedPrice },
        };
        const updatedConf = Math.max(0, Math.min(100, newConf + ev.confDelta));

        setPortfolio(updatedPort);
        setLpConfidence(updatedConf);

        setHistory((prev) => ({
          ...prev,
          [ev.ticker]: [...prev[ev.ticker].slice(0, -1), updatedPrice],
        }));

        const body = [
          ev.desc,
          `Market reaction: ${ev.ticker} traded violently on the bulletin. LP confidence adjusted by ${ev.confDelta > 0 ? '+' : ''}${ev.confDelta}%.`,
        ];

        setActiveNewsModal({
          headline: ev.headline,
          body,
          onDismiss: () => {
            writeLine(`\n>>> DOW WIRE: ${ev.headline}`, 'amber');
            writeLine(
              `[MARKET IMPACT] ${ev.ticker} adjusted by ${Math.round((ev.mult - 1) * 100)}%.`,
              'highlight'
            );
            displayDashboard(targetWeek, newCash, updatedConf, updatedPort);
          },
        });
        return;
      }
    }

    displayDashboard(targetWeek, newCash, newConf, newPort);
  };

  const advanceMarket = () => {
    const nextWeek = week + 1;
    setWeek(nextWeek);

    // Deduct overhead
    let nextCash = cash - weeklyOverhead;
    let nextConf = lpConfidence;

    if (nextCash < 0) {
      writeLine(
        `[!] CASH DEFICIT: Account overdrawn ($${nextCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). LPs alarming (-8% Conf).`,
        'alert'
      );
      nextConf = Math.max(0, nextConf - 8);
    }

    // Volatility models
    const hcksocDelta = !crashTriggered
      ? Math.random() * (0.22 - -0.06) + -0.06
      : Math.random() * (0.22 - -0.1) + -0.1;
    const caponeDelta = !crashTriggered
      ? Math.random() * (0.15 - -0.04) + -0.04
      : Math.random() * (0.14 - -0.07) + -0.07;
    const telluvDelta = !crashTriggered
      ? Math.random() * (0.04 - -0.01) + -0.01
      : Math.random() * (0.05 - -0.02) + -0.02;

    const nextPort = {
      HCKSOC: {
        shares: portfolio.HCKSOC.shares,
        price: Math.max(0.5, +(portfolio.HCKSOC.price * (1 + hcksocDelta)).toFixed(2)),
      },
      CAPONE: {
        shares: portfolio.CAPONE.shares,
        price: Math.max(1.0, +(portfolio.CAPONE.price * (1 + caponeDelta)).toFixed(2)),
      },
      TELLUV: {
        shares: portfolio.TELLUV.shares,
        price: Math.max(5.0, +(portfolio.TELLUV.price * (1 + telluvDelta)).toFixed(2)),
      },
    };

    setCash(nextCash);
    setPortfolio(nextPort);

    // Sync History
    setHistory((prev) => ({
      weeks: [...prev.weeks, nextWeek],
      HCKSOC: [...prev.HCKSOC, nextPort.HCKSOC.price],
      CAPONE: [...prev.CAPONE, nextPort.CAPONE.price],
      TELLUV: [...prev.TELLUV, nextPort.TELLUV.price],
    }));

    // LP scrutiny penalties
    const nav = getPortfolioValue(nextPort, nextCash);
    if (nav < 4_800_000) {
      nextConf = Math.max(0, nextConf - 4);
      writeLine('[WARN] Performance below benchmark ($4.8M). LPs growing anxious (-4% Conf).', 'alert');
    }
    if (nav < 3_800_000) {
      nextConf = Math.max(0, nextConf - 6);
      writeLine(
        '[WARN] CRITICAL DRAWDOWN below $3.8M! LPs threatening redemption run (-6% Conf).',
        'alert'
      );
    }
    setLpConfidence(nextConf);

    if (nextWeek > 24) {
      endGame(nav);
    } else {
      checkNewsEvents(nextWeek, nextPort, nextCash, nextConf);
    }
  };

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    const val = inputCommand.trim();
    setInputCommand('');

    if (!val || gameOver) return;

    writeLine(`> ${val}`, 'highlight');

    // Multi-step buy/sell execution
    if (pendingAction) {
      const { action, step, payload } = pendingAction;
      if (action === 'BUY' || action === 'SELL') {
        if (step === 'TICKER') {
          const t = val.toUpperCase();
          if (portfolio[t]) {
            setPendingAction({ action, step: 'QTY', payload: { ticker: t } });
            writeLine(`Enter Quantity to ${action}:`);
          } else {
            writeLine('[ERR] Invalid Ticker. Aborting order.', 'alert');
            setPendingAction(null);
            displayDashboard();
          }
        } else if (step === 'QTY') {
          const amt = parseInt(val, 10);
          const t = payload.ticker;
          if (isNaN(amt) || amt <= 0) {
            writeLine('[ERR] Quantity must be a positive integer.', 'alert');
          } else {
            if (action === 'BUY') {
              const cost = amt * portfolio[t].price;
              if (cash >= cost) {
                const nextCash = cash - cost;
                const nextPort = {
                  ...portfolio,
                  [t]: { ...portfolio[t], shares: portfolio[t].shares + amt },
                };
                setCash(nextCash);
                setPortfolio(nextPort);
                writeLine(
                  `[EXEC] Bought ${amt.toLocaleString()} shares of ${t} for $${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
                  'highlight'
                );
                displayDashboard(week, nextCash, lpConfidence, nextPort);
              } else {
                writeLine('[ERR] Insufficient liquidity.', 'alert');
                displayDashboard();
              }
            } else if (action === 'SELL') {
              if (portfolio[t].shares >= amt) {
                const rev = amt * portfolio[t].price;
                const nextCash = cash + rev;
                const nextPort = {
                  ...portfolio,
                  [t]: { ...portfolio[t], shares: portfolio[t].shares - amt },
                };
                setCash(nextCash);
                setPortfolio(nextPort);
                writeLine(
                  `[EXEC] Sold ${amt.toLocaleString()} shares of ${t} for $${rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
                  'highlight'
                );
                displayDashboard(week, nextCash, lpConfidence, nextPort);
              } else {
                writeLine('[ERR] Not enough shares held to cover order.', 'alert');
                displayDashboard();
              }
            }
          }
          setPendingAction(null);
        }
      }
      return;
    }

    // Root command options
    if (val === '1') {
      setPendingAction({ action: 'BUY', step: 'TICKER', payload: {} });
      writeLine('Ticker to BUY (HCKSOC / CAPONE / TELLUV):');
    } else if (val === '2') {
      setPendingAction({ action: 'SELL', step: 'TICKER', payload: {} });
      writeLine('Ticker to SELL (HCKSOC / CAPONE / TELLUV):');
    } else if (val === '3') {
      const cost = 150_000;
      if (cash >= cost) {
        const nextCash = cash - cost;
        const nextConf = Math.min(100, lpConfidence + 18);
        setCash(nextCash);
        setLpConfidence(nextConf);
        writeLine(
          '[+] Lavish Silicon Alley dinner & investor roadshow hosted. LP confidence +18%.',
          'highlight'
        );
        displayDashboard(week, nextCash, nextConf, portfolio);
      } else {
        writeLine(
          `[ERR] Insufficient funds ($${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} required).`,
          'alert'
        );
        displayDashboard();
      }
    } else if (val === '4') {
      advanceMarket();
    } else if (val === '5') {
      writeLine('Session terminated by user.', 'alert');
      setIsInputDisabled(true);
      setGameOver(true);
    } else if (val === '6') {
      setShowViewerModal(true);
      displayDashboard();
    } else {
      writeLine(`Unknown command: '${val}'. Valid: [1, 2, 3, 4, 5, 6]`);
    }
  };

  // Color mappings matching Python CRT palette
  const getTagStyle = (tag) => {
    switch (tag) {
      case 'amber':
        return { color: '#ffb000' };
      case 'alert':
        return { color: '#ff3333', fontWeight: 'bold' };
      case 'highlight':
        return { color: '#ffffff' };
      case 'dim':
        return { color: '#1a801a' };
      case 'cyan':
        return { color: '#00e5ff' };
      default:
        return { color: '#33ff33' };
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#080808',
        color: '#33ff33',
        fontFamily: "'Courier New', Courier, monospace",
        height: '100vh',
        minHeight: '640px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '6px',
        position: 'relative',
      }}
    >
      {/* Header Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#111811',
          border: '1px ridge #336633',
          padding: '4px 10px',
          marginBottom: '4px',
        }}
      >
        <span style={{ color: '#ffb000', fontSize: '11px', fontWeight: 'bold' }}>
          [SYS: DEC-ALPHA 2000] | FEED: CONNECTED (PORT 443) | STATUS: ONLINE
        </span>
        <button
          onClick={() => setShowViewerModal((prev) => !prev)}
          style={{
            backgroundColor: '#0d2015',
            color: '#00e5ff',
            border: '1px solid #00e5ff',
            fontFamily: 'inherit',
            fontWeight: 'bold',
            fontSize: '11px',
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          [📈 {showViewerModal ? 'HIDE STOCK VIEWER' : 'OPEN STOCK VIEWER'}]
        </button>
      </div>

      {/* Main Terminal Screen Area */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#0c0d0c',
          border: '2px inset #1b4d1b',
          padding: '12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '13px',
          lineHeight: '1.4',
        }}
      >
        {terminalLogs.map((log) => (
          <div
            key={log.id}
            style={{
              ...getTagStyle(log.tag),
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {log.text}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Command Input Bar */}
      <form
        onSubmit={handleCommandSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#0a0f0a',
          border: '1px ridge #336633',
          padding: '4px 8px',
          marginTop: '4px',
        }}
      >
        <span style={{ color: '#ffb000', fontWeight: 'bold', fontSize: '13px', marginRight: '6px' }}>
          COMMAND &gt;&gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          disabled={isInputDisabled}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#33ff33',
            fontFamily: 'inherit',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
          autoFocus
        />
      </form>

      {/* Breaking News Popup Modal */}
      {activeNewsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '620px',
              maxWidth: '95vw',
              backgroundColor: '#050805',
              border: '2px solid #ff4444',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 0 24px rgba(255, 68, 68, 0.4)',
            }}
          >
            <div
              style={{
                backgroundColor: '#3b0000',
                border: '2px ridge #881111',
                padding: '6px',
                textAlign: 'center',
                color: '#ff4444',
                fontWeight: 'bold',
                fontSize: '13px',
                marginBottom: '10px',
              }}
            >
              *** URGENT BULLETIN - DOW JONES WIRE SERVICES ***
            </div>

            <div
              style={{
                backgroundColor: '#0d140d',
                border: '2px inset #1a331a',
                padding: '14px',
                color: '#33ff33',
                fontSize: '12px',
                lineHeight: '1.5',
                marginBottom: '12px',
              }}
            >
              <div style={{ color: '#ffb000', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>
                {activeNewsModal.headline}
              </div>
              {activeNewsModal.body.map((p, idx) => (
                <div key={idx} style={{ marginBottom: '8px' }}>
                  {p}
                </div>
              ))}
              <div style={{ color: '#1a801a', margin: '8px 0' }}>{'-'.repeat(56)}</div>
              <div style={{ color: '#ff3333', fontWeight: 'bold' }}>
                ACTION MANDATORY: You must acknowledge this wire report to resume trading.
              </div>
            </div>

            <button
              onClick={() => {
                const cb = activeNewsModal.onDismiss;
                setActiveNewsModal(null);
                if (cb) cb();
              }}
              style={{
                alignSelf: 'center',
                backgroundColor: '#112211',
                color: '#ffb000',
                border: '2px raised #448844',
                fontFamily: 'inherit',
                fontWeight: 'bold',
                fontSize: '12px',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
              autoFocus
            >
              [ ACKNOWLEDGE &amp; RESUME TERMINAL ]
            </button>
          </div>
        </div>
      )}

      {/* Stock Viewer Embedded / Floating Window */}
      {showViewerModal && (
        <div
          style={{
            position: 'fixed',
            inset: '30px',
            backgroundColor: '#080c08',
            border: '2px solid #00e5ff',
            boxShadow: '0 0 25px rgba(0, 229, 255, 0.3)',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              backgroundColor: '#0e1d1e',
              borderBottom: '1px solid #00e5ff',
              padding: '6px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#00e5ff', fontWeight: 'bold', fontSize: '12px' }}>
              WS_TICKER_CHART v2.4 // THREE-STOCK LIVE VIEWER (LINKED)
            </span>
            <button
              onClick={() => setShowViewerModal(false)}
              style={{
                backgroundColor: '#331111',
                color: '#ff8888',
                border: '1px solid #883333',
                fontFamily: 'inherit',
                fontWeight: 'bold',
                fontSize: '11px',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              [CLOSE ✕]
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <StockViewer
              externalHistory={history}
              externalWeeks={history.weeks}
              onManualAdvance={advanceMarket}
              isStandalone={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

