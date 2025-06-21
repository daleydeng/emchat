import React, { useState } from 'react';
import './TabContainer.css';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabContainerProps {
  tabs: Tab[];
  defaultActiveTab?: string;
  className?: string;
}

const TabContainer: React.FC<TabContainerProps> = ({
  tabs,
  defaultActiveTab,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(
    defaultActiveTab || (tabs.length > 0 ? tabs[0].id : '')
  );

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      setActiveTab(tabId);
    }
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={`tab-container ${className}`}>
      <div className="tab-header">
        <div className="tab-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${
                activeTab === tab.id ? 'active' : ''
              } ${tab.disabled ? 'disabled' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              disabled={tab.disabled}
              title={tab.disabled ? 'Tab disabled' : undefined}
            >
              {tab.icon && <span className="tab-icon">{tab.icon}</span>}
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="tab-content">
        {activeTabContent}
      </div>
    </div>
  );
};

export default TabContainer;
