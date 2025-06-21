import BluetoothScanner from "./components/BluetoothScanner";
import ChatInterface from "./components/ChatInterface";
import LlmServicePanel from "./components/LlmServicePanel";
import AppSettings from "./components/AppSettings";
import TabContainer, { Tab } from "./components/TabContainer";
import ErrorBoundary from "./components/ErrorBoundary";
import { LlmProvider } from "./contexts/LlmContext";
import "./App.css";

function App() {
  const tabs: Tab[] = [
    {
      id: 'bluetooth',
      label: 'Bluetooth Scanner',
      icon: '📡',
      content: <BluetoothScanner />,
    },
    {
      id: 'llm-service',
      label: 'LLM Service',
      icon: '⚙️',
      content: <LlmServicePanel />,
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: '💬',
      content: <ChatInterface />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '🔧',
      content: <AppSettings />,
    },
  ];

  return (
    <LlmProvider>
      <main className="container">
        <ErrorBoundary>
          <TabContainer tabs={tabs} defaultActiveTab="bluetooth" />
        </ErrorBoundary>
      </main>
    </LlmProvider>
  );
}

export default App;
