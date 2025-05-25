import * as React from 'react';

interface Props {
  isOpen: boolean;
  onClick: () => void;
}

const ChatToggle: React.FC<Props> = ({
  isOpen,
  onClick
}) => {
  return (
    <button
      className="chat-toggle"
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      title={isOpen ? 'Close chat' : 'Open chat'}
    >
      <span className={`chat-toggle-icon icon-ui-${isOpen ? 'close' : 'chat'}`}></span>
    </button>
  );
};

export default ChatToggle;
