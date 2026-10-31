import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import MarketSimReact from './marketsimreact';
import StockViewer from './stockviewerreact';

function App() {
  const [activeTab, setActiveTab] = useState('marketsim');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#080808' }}>
      <nav
        style={{
          display: 'flex',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: '#0c120c',
          borderBottom: '1px solid #1f3f1f',
          fontFamily: "'Courier New', Courier, monospace",
        }}
      >
        <button
          onClick={() => setActiveTab('marketsim')}
          style={{
            backgroundColor: activeTab === 'marketsim' ? '#163316' : '#080c08',
            color: activeTab === 'marketsim' ? '#33ff33' : '#668866',
            border: activeTab === 'marketsim' ? '1px solid #33ff33' : '1px solid #224422',
            padding: '5px 12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'inherit',
          }}
        >
          [ TERMINAL SIMULATOR ]
        </button>
        <button
          onClick={() => setActiveTab('stockviewer')}
          style={{
            backgroundColor: activeTab === 'stockviewer' ? '#163316' : '#080c08',
            color: activeTab === 'stockviewer' ? '#00e5ff' : '#668866',
            border: activeTab === 'stockviewer' ? '1px solid #00e5ff' : '1px solid #224422',
            padding: '5px 12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'inherit',
          }}
        >
          [ STANDALONE STOCK VIEWER ]
        </button>
      </nav>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'marketsim' ? <MarketSimReact /> : <StockViewer />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

