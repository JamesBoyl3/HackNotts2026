import React, { useState, useEffect, useRef } from 'react';

export const STOCK_INFO = {
  HCKSOC: {
    name: "HackSoc Systems",
    color: "#00ff66", // Phosphor Green
    accent: "#00aa44",
    desc: "High-Beta Tech / Internet Infrastructure",
  },
  CAPONE: {
    name: "Capital One",
    color: "#ffaa00", // Bloomberg Amber
    accent: "#cc8800",
    desc: "B2B Credit & Venture Liquidity",
  },
  TELLUV: {
    name: "Telluvium",
    color: "#00ddff", // Electric Cyan
    accent: "#0099bb",
    desc: "Defensive Fiber & Telecom Grid",
  },
};

export default function StockViewer({
  externalHistory = null,
  externalWeeks = null,
  onManualAdvance = null,
  isStandalone = true,
}) {
  // Price history state (defaults to match Python initial setup)
  const [internalHistory, setInternalHistory] = useState({
    HCKSOC: [40.0],
    CAPONE: [70.0],
    TELLUV: [25.0],
  });
  const [internalWeeks, setInternalWeeks] = useState([1]);
  const [marqueeText, setMarqueeText] = useState(
    "MARKET SURVEILLANCE FEED: HCKSOC [35k @ $40.0] | CAPONE [20k @ $70.0] | TELLUV [40k @ $25.0] -- CHART AUTO-SYNCS AS MARKET TICKS"
  );

  // Chart view and configuration state
  const [activeTickers, setActiveTickers] = useState({
    HCKSOC: true,
    CAPONE: true,
    TELLUV: true,
  });
  const [viewMode, setViewMode] = useState("MULTI"); // "MULTI" | "HCKSOC" | "CAPONE" | "TELLUV"
  const [chartType, setChartType] = useState("LINE"); // "LINE" | "AREA"
  const [hoverIndex, setHoverIndex] = useState(null);

  const canvasRef = useRef(null);

  // Use external data if passed, else internal
  const history = externalHistory || internalHistory;
  const weeks = externalWeeks || internalWeeks;

  // Toggle active ticker line
  const toggleTicker = (ticker) => {
    setActiveTickers((prev) => ({
      ...prev,
      [ticker]: !prev[ticker],
    }));
  };

  // Toggle style LINE / AREA
  const toggleChartStyle = () => {
    setChartType((prev) => (prev === "LINE" ? "AREA" : "LINE"));
  };

  // Manual Step Simulation (matches python volatility logic)
  const handleManualStep = () => {
    if (onManualAdvance) {
      onManualAdvance();
      return;
    }
    const nextWeek = weeks[weeks.length - 1] + 1;
    const dHcksoc = Math.random() * (0.22 - -0.06) + -0.06;
    const dCapone = Math.random() * (0.15 - -0.04) + -0.04;
    const dTelluv = Math.random() * (0.04 - -0.01) + -0.01;

    const newHcksoc = Math.max(0.5, +(history.HCKSOC[history.HCKSOC.length - 1] * (1 + dHcksoc)).toFixed(2));
    const newCapone = Math.max(1.0, +(history.CAPONE[history.CAPONE.length - 1] * (1 + dCapone)).toFixed(2));
    const newTelluv = Math.max(5.0, +(history.TELLUV[history.TELLUV.length - 1] * (1 + dTelluv)).toFixed(2));

    setInternalWeeks((prev) => [...prev, nextWeek]);
    setInternalHistory((prev) => ({
      HCKSOC: [...prev.HCKSOC, newHcksoc],
      CAPONE: [...prev.CAPONE, newCapone],
      TELLUV: [...prev.TELLUV, newTelluv],
    }));
    setMarqueeText(`>> MANUALLY ADVANCED TO WEEK ${nextWeek} // PRICES UPDATED.`);
  };

  // Reset Simulation
  const handleResetSim = () => {
    setInternalHistory({
      HCKSOC: [40.0],
      CAPONE: [70.0],
      TELLUV: [25.0],
    });
    setInternalWeeks([1]);
    setMarqueeText("SIMULATION HISTORY RESET TO WEEK 1.");
  };

  // Draw pure retro CRT canvas chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const width = (canvas.width = rect.width * (window.devicePixelRatio || 1));
    const height = (canvas.height = rect.height * (window.devicePixelRatio || 1));

    ctx.save();
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    const cssWidth = rect.width;
    const cssHeight = rect.height;

    // Clear background
    ctx.fillStyle = "#070b07";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const padLeft = 65;
    const padRight = 35;
    const padTop = 35;
    const padBottom = 45;

    const plotW = cssWidth - padLeft - padRight;
    const plotH = cssHeight - padTop - padBottom;

    if (plotW <= 10 || plotH <= 10) {
      ctx.restore();
      return;
    }

    // Chart Box inner fill
    ctx.fillStyle = "#090f09";
    ctx.strokeStyle = "#1a331a";
    ctx.lineWidth = 1.5;
    ctx.fillRect(padLeft, padTop, plotW, plotH);
    ctx.strokeRect(padLeft, padTop, plotW, plotH);

    // CRT scanlines inside chart
    ctx.strokeStyle = "#0d160d";
    ctx.lineWidth = 1;
    for (let y = padTop; y < cssHeight - padBottom; y += 4) {
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(cssWidth - padRight, y);
      ctx.stroke();
    }

    // Collect active series
    const activeSeries = {};
    Object.keys(history).forEach((ticker) => {
      if (viewMode === "MULTI" || viewMode === ticker) {
        if (activeTickers[ticker]) {
          activeSeries[ticker] = history[ticker] || [];
        }
      }
    });

    const allPrices = [];
    Object.values(activeSeries).forEach((s) => allPrices.push(...s));
    const numPoints = weeks.length;

    if (allPrices.length === 0 || numPoints === 0) {
      ctx.fillStyle = "#33ff33";
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText("[ AWAITING LIVE MARKET FEED TICK... ]", cssWidth / 2, cssHeight / 2 - 8);
      ctx.font = "11px 'Courier New', monospace";
      ctx.fillText("Run marketsim to stream live weekly prices", cssWidth / 2, cssHeight / 2 + 14);
      ctx.restore();
      return;
    }

    let minVal = Math.min(...allPrices);
    let maxVal = Math.max(...allPrices);
    if (minVal === maxVal) {
      minVal = Math.max(0, minVal - 10);
      maxVal = maxVal + 10;
    } else {
      const padding = (maxVal - minVal) * 0.12;
      minVal = Math.max(0, minVal - padding);
      maxVal = maxVal + padding;
    }

    // Horizontal grid & Y-axis labels
    const stepsY = 5;
    ctx.font = "9px 'Courier New', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= stepsY; i++) {
      const val = minVal + ((maxVal - minVal) * i) / stepsY;
      const y = padTop + plotH - (i / stepsY) * plotH;

      ctx.strokeStyle = "#162e16";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(cssWidth - padRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#44aa44";
      ctx.fillText(`$${val.toFixed(1)}`, padLeft - 8, y);
    }

    // Vertical grid & X-axis labels
    const xCoords = [];
    if (numPoints === 1) {
      xCoords.push(padLeft + plotW / 2);
    } else {
      for (let i = 0; i < numPoints; i++) {
        xCoords.push(padLeft + (i / (numPoints - 1)) * plotW);
      }
    }

    let skip = 1;
    if (numPoints > 16) skip = 2;
    if (numPoints > 32) skip = 4;

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < numPoints; i++) {
      const x = xCoords[i];
      const w = weeks[i];
      if (i % skip === 0 || i === numPoints - 1) {
        ctx.strokeStyle = "#162e16";
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, cssHeight - padBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#44aa44";
        ctx.font = "bold 9px 'Courier New', monospace";
        ctx.fillText(`W${w}`, x, cssHeight - padBottom + 12);
      }
    }

    // Draw lines & area
    Object.keys(activeSeries).forEach((ticker) => {
      const series = activeSeries[ticker];
      if (!series || series.length === 0) return;
      const color = STOCK_INFO[ticker]?.color || "#33ff33";
      const accent = STOCK_INFO[ticker]?.accent || "#117711";

      const pts = series.map((p, i) => {
        const x = xCoords[i];
        const y = padTop + plotH - ((p - minVal) / (maxVal - minVal)) * plotH;
        return { x, y, p };
      });

      // Area fill
      if (chartType === "AREA" && pts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, cssHeight - padBottom);
        pts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.lineTo(pts[pts.length - 1].x, cssHeight - padBottom);
        ctx.closePath();
        ctx.fillStyle = "rgba(12, 29, 12, 0.65)";
        ctx.fill();
      }

      // Draw series Glow line underneath
      if (pts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = accent;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Main line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Nodes
      pts.forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#050805";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Latest price pill on right
      const last = pts[pts.length - 1];
      ctx.fillStyle = "#112211";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      const pillY = Math.max(padTop + 4, Math.min(cssHeight - padBottom - 16, last.y - 8));
      ctx.fillRect(cssWidth - padRight + 2, pillY, 32, 16);
      ctx.strokeRect(cssWidth - padRight + 2, pillY, 32, 16);

      ctx.fillStyle = color;
      ctx.font = "bold 8px 'Courier New', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(last.p.toFixed(1), cssWidth - padRight + 4, pillY + 8);
    });

    // Crosshair & Tooltip
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < numPoints) {
      const cx = xCoords[hoverIndex];
      const cw = weeks[hoverIndex];

      // Vertical guide line
      ctx.strokeStyle = "#ffb000";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, padTop);
      ctx.lineTo(cx, cssHeight - padBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top indicator pill
      ctx.fillStyle = "#ffb000";
      ctx.fillRect(cx - 24, padTop - 18, 48, 16);
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(cx - 24, padTop - 18, 48, 16);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 8px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Wk ${cw}`, cx, padTop - 10);

      // Tooltip Box
      const tipLines = [`WEEK ${String(cw).padStart(2, "0")}`];
      ["HCKSOC", "CAPONE", "TELLUV"].forEach((t) => {
        if (activeSeries[t] && hoverIndex < activeSeries[t].length) {
          tipLines.push(`${t}: $${activeSeries[t][hoverIndex].toFixed(2)}`);
        }
      });

      const tipX = cx + 15 + 130 < cssWidth ? cx + 15 : cx - 130;
      const tipY = padTop + 15;
      const tipH = 16 * tipLines.length + 8;

      ctx.fillStyle = "#0a140a";
      ctx.strokeStyle = "#33ff33";
      ctx.lineWidth = 1.5;
      ctx.fillRect(tipX - 6, tipY - 6, 120, tipH);
      ctx.strokeRect(tipX - 6, tipY - 6, 120, tipH);

      ctx.fillStyle = "#33ff33";
      ctx.font = "bold 9px 'Courier New', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      tipLines.forEach((line, idx) => {
        ctx.fillText(line, tipX, tipY + idx * 16);
      });
    }

    // Title / Mode banner
    const titleMode =
      viewMode === "MULTI" ? "PORTFOLIO BASKET (ALL 3 STOCKS)" : `FOCUSED VIEW: ${viewMode}`;
    ctx.fillStyle = "#ffb000";
    ctx.font = "bold 9px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`>> ${titleMode} -- REALTIME FEED`, padLeft, 16);

    ctx.restore();
  }, [history, weeks, activeTickers, viewMode, chartType, hoverIndex]);

  // Handle canvas mouse move
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const padLeft = 65;
    const padRight = 35;
    const plotW = rect.width - padLeft - padRight;
    const numPoints = weeks.length;

    if (numPoints <= 0 || mouseX < padLeft || mouseX > rect.width - padRight) {
      setHoverIndex(null);
      return;
    }

    let closestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < numPoints; i++) {
      const x = numPoints === 1 ? padLeft + plotW / 2 : padLeft + (i / (numPoints - 1)) * plotW;
      const dist = Math.abs(x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    setHoverIndex(closestIdx);
  };

  return (
    <div
      style={{
        backgroundColor: "#080c08",
        color: "#33ff33",
        fontFamily: "'Courier New', Courier, monospace",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "580px",
        boxSizing: "border-box",
        border: "1px solid #224422",
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#111a11",
          border: "1px ridge #336633",
          padding: "6px 12px",
          marginBottom: "6px",
        }}
      >
        <div style={{ color: "#ffb000", fontWeight: "bold", fontSize: "12px" }}>
          [NOTTINGHAM EXCHANGE TICKER FEED] // NY-FIX BRIDGE 1999
        </div>
        <div style={{ color: "#33ff33", fontWeight: "bold", fontSize: "11px" }}>
          STATUS: {externalHistory ? "LINKED (INSTANCE)" : "CONNECTED (LIVE)"}
        </div>
      </div>

      {/* 2. Metric / Summary Cards */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "6px",
        }}
      >
        {Object.entries(STOCK_INFO).map(([ticker, info]) => {
          const series = history[ticker] || [];
          const curr = series.length > 0 ? series[series.length - 1] : 0;
          const first = series.length > 0 ? series[0] : curr;
          const pct = first !== 0 ? ((curr - first) / first) * 100 : 0;
          const sign = pct >= 0 ? "+" : "";
          const lo = series.length > 0 ? Math.min(...series).toFixed(1) : curr.toFixed(1);
          const hi = series.length > 0 ? Math.max(...series).toFixed(1) : curr.toFixed(1);

          return (
            <div
              key={ticker}
              style={{
                flex: 1,
                backgroundColor: "#0d170d",
                border: "1px solid #224422",
                padding: "8px 10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: info.color, fontWeight: "bold", fontSize: "13px" }}>
                  {ticker}
                </span>
                <span style={{ color: "#66aa66", fontSize: "10px" }}>{info.name}</span>
              </div>
              <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "18px", margin: "2px 0" }}>
                ${curr.toFixed(2)}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              >
                <span style={{ color: pct >= 0 ? "#33ff33" : "#ff4444" }}>
                  {sign}
                  {pct.toFixed(1)}% (vs W01)
                </span>
                <span style={{ color: "#447744", fontWeight: "normal", fontSize: "10px" }}>
                  Lo: ${lo} Hi: ${hi}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Chart Canvas Area */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#0c0f0c",
          border: "2px inset #1b381b",
          position: "relative",
          minHeight: "320px",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>

      {/* 4. Controls & Legend Bar */}
      <div
        style={{
          backgroundColor: "#0a100a",
          border: "1px ridge #224422",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "6px",
        }}
      >
        <span style={{ color: "#ffb000", fontWeight: "bold", fontSize: "11px" }}>SERIES:</span>
        {Object.entries(STOCK_INFO).map(([ticker, info]) => {
          const active = activeTickers[ticker];
          return (
            <button
              key={ticker}
              onClick={() => toggleTicker(ticker)}
              style={{
                backgroundColor: active ? "#112211" : "#0a110a",
                color: active ? info.color : "#445544",
                border: active ? `1px solid ${info.color}` : "1px solid #334433",
                fontWeight: "bold",
                fontSize: "11px",
                padding: "3px 8px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ● {ticker}
            </button>
          );
        })}

        <span style={{ color: "#ffb000", fontWeight: "bold", fontSize: "11px", marginLeft: "6px" }}>
          | VIEW:
        </span>
        {["ALL", "HCKSOC", "CAPONE", "TELLUV"].map((mode) => {
          const mCode = mode === "ALL" ? "MULTI" : mode;
          const isSelected = viewMode === mCode;
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mCode)}
              style={{
                backgroundColor: isSelected ? "#ffb000" : "#142414",
                color: isSelected ? "#000000" : "#33ff33",
                border: "1px solid #284428",
                fontWeight: "bold",
                fontSize: "10px",
                padding: "3px 6px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {mode}
            </button>
          );
        })}

        <button
          onClick={toggleChartStyle}
          style={{
            backgroundColor: "#112222",
            color: "#00e5ff",
            border: "1px solid #0099aa",
            fontWeight: "bold",
            fontSize: "10px",
            padding: "3px 8px",
            cursor: "pointer",
            fontFamily: "inherit",
            marginLeft: "6px",
          }}
        >
          STYLE: {chartType}
        </button>

        {isStandalone && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
            <button
              onClick={handleManualStep}
              style={{
                backgroundColor: "#2e542e",
                color: "#ffffff",
                border: "1px solid #44aa44",
                fontWeight: "bold",
                fontSize: "11px",
                padding: "3px 10px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              [+ SIM STEP]
            </button>
            <button
              onClick={handleResetSim}
              style={{
                backgroundColor: "#331111",
                color: "#ff8888",
                border: "1px solid #883333",
                fontSize: "10px",
                padding: "3px 8px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              [RESET SIM]
            </button>
          </div>
        )}
      </div>

      {/* 5. Bottom Marquee */}
      <div
        style={{
          marginTop: "6px",
          color: "#228822",
          fontSize: "10px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {marqueeText}
      </div>
    </div>
  );
}

