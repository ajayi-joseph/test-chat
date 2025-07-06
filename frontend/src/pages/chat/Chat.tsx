import Header from "./_components/header/Header.tsx";
import { useState } from "react";
import ChatTab from "./_components/chat-tab/ChatTab.tsx";
import ProfileTab from "./_components/profile-tab/ProfileTab.tsx";
import Tabs from "../../components/tabs/Tabs.tsx";

type TabId = "chat" | "profile";

const tabs = [
  { id: "chat" as const, label: "Chat" },
  { id: "profile" as const, label: "Profile" },
] as const;

const Chat = () => {
  const [activeTab, setActiveTab] = useState<TabId>("chat");

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Sticky header and tabs */}
      <div className="flex-shrink-0 shadow-sm border-b border-gray-300 ">
        <Header />
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      {/* Scrollable content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "chat" && <ChatTab />}
        {activeTab === "profile" && <ProfileTab />}
      </div>
    </div>
  );
};

export default Chat;