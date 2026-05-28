import CreateGroupModal from "../../components/createGroupModal";
import "./chat.css";
import ChatArea from "../../components/ChatArea/Chatarea";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useChatContext } from "../../app/ChatContext";

export default function ChatPage() {
  const {
    chatType,
    selectedUser,
    selectedUserId,
    selectedGroup,
    isMobile,
    uploadingFile,
    messages,
    mobileChatOpen,
    text,
    setText,
    handleSend,
    handleFileSelect,
    selectedFile,
    setSelectedFile,
    userId,
    onlineUsers,
    selectedUserObj,
    setGroups,
    setSelectedGroup,
    handleGroupDeletedFromModal,
    showModal,
    setShowModal,
    handleGroupCreated,
    chatUsers,
  } = useChatContext();

  return (
    <div className="chat-container">

      {/* MOBILE */}
  {isMobile ? (
    <>
      {!mobileChatOpen ? (

        <Sidebar />
      ) : (
        <ChatArea
        chatType={chatType}
        selectedUser={selectedUser}
        selectedUserId={selectedUserId}
        selectedGroup={selectedGroup}
        uploadingFile={uploadingFile}
        chatId={
          chatType === "private" ? selectedUserObj?.chatId : selectedGroup?._id
        }
        messages={messages}
        text={text}
        onTextChange={setText}
        onSend={handleSend}
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        onClearSelectedFile={() => setSelectedFile(null)}
        userId={userId || ""}
        onlineUsers={onlineUsers}
        selectedUserObj={selectedUserObj}
        onGroupUpdated={(updatedGroup: any) => {
          setSelectedGroup(updatedGroup);
          setGroups((prev: any[]) =>
            prev.map((g) =>
              String(g._id) === String(updatedGroup._id) ? updatedGroup : g
            )
          );
        }}
        onGroupDeleted={handleGroupDeletedFromModal}
      />
      )}
    </>
  ) : (
    <>
      <Sidebar />
      <ChatArea
        chatType={chatType}
        selectedUser={selectedUser}
        selectedUserId={selectedUserId}
        selectedGroup={selectedGroup}
        uploadingFile={uploadingFile}
        chatId={
          chatType === "private" ? selectedUserObj?.chatId : selectedGroup?._id
        }
        messages={messages}
        text={text}
        onTextChange={setText}
        onSend={handleSend}
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        onClearSelectedFile={() => setSelectedFile(null)}
        userId={userId || ""}
        onlineUsers={onlineUsers}
        selectedUserObj={selectedUserObj}
        onGroupUpdated={(updatedGroup: any) => {
          setSelectedGroup(updatedGroup);
          setGroups((prev: any[]) =>
            prev.map((g) =>
              String(g._id) === String(updatedGroup._id) ? updatedGroup : g
            )
          );
        }}
        onGroupDeleted={handleGroupDeletedFromModal}
      />
    </>
  )}




      {showModal && (
        <CreateGroupModal
          users={chatUsers}
          onClose={() => setShowModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
