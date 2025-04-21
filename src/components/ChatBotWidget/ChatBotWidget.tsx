import React, { useState, useRef, useEffect } from 'react';
import './style.css';
import { Bot, BotMessageSquare } from 'lucide-react';

interface Message {
  role: string;
  content: string;
}

interface ChatWidgetIOProps {
  callApi: (message: string) => Promise<string>;
  chatbotName?: string;
  isTypingMessage?: string;
  IncommingErrMsg?: string;
  primaryColor?: string;
  inputMsgPlaceholder?: string;
  chatIcon?: React.ReactNode;
  botIcon?: React.ReactNode;
  botFontStyle?: React.CSSProperties;
  typingFontStyle?: React.CSSProperties;
  handleNewMessage?: (message: Message) => void;
  onBotResponse?: (response: string) => void;
  messages?: Message[];
  useInnerHTML?: boolean;
}

const ChatBotWidget = ({
  callApi,
  chatbotName = 'Chatbot',
  isTypingMessage = 'Typing...',
  IncommingErrMsg = 'Oops! Something went wrong. Please try again.',
  primaryColor = '#eb4034',
  inputMsgPlaceholder = 'Send a Message',
  chatIcon = <ChatIcon />,
  botIcon = <BotIcon />,
  botFontStyle = {},
  typingFontStyle = {},
  handleNewMessage,
  onBotResponse,
  messages = [],
  useInnerHTML = false,
}: ChatWidgetIOProps) => {
  const [userMessage, setUserMessage] = useState<string>('');
  const [typing, setTyping] = useState<boolean>(false);
  const chatInputRef = useRef<any>(null);
  const chatboxRef = useRef<any>(null);

  const handleChat = async () => {
    const trimmedMessage = userMessage.trim();
    if (!trimmedMessage) return;

    setUserMessage('');

    // Display outgoing message
    const outgoingMessage = { role: 'user', content: trimmedMessage };
    handleNewMessage?.(outgoingMessage);

    try {
      setTyping(true);

      // Use the custom API call function
      const botResponse = await callApi(trimmedMessage);
      console.log('Bot Response:', botResponse); // Debugging

      // Call the callback function with the bot's response
      onBotResponse?.(botResponse);
    } catch (error) {
      console.error('Error in API call:', error); // Debugging
      // Display error message if API call fails
      const errorMessage = { role: 'error', content: IncommingErrMsg };
      handleNewMessage?.(errorMessage);
    } finally {
      setTyping(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserMessage(event.target.value);

    // Reset height to auto before calculating new height
    chatInputRef.current.style.height = 'auto';

    // Adjust the height dynamically based on content
    chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 80)}px`;
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && window.innerWidth > 800) {
      event.preventDefault();
      handleChat();
    }
  };

  const toggleChatbot = () => {
    document.body.classList.toggle('show-chatbot');
  };

  useEffect(() => {
    console.log('Chatbot mounted'); // Debugging

    const closeBtn: HTMLElement | null = document.querySelector('.close-btn');
    closeBtn?.addEventListener('click', toggleChatbot);

    return () => {
      closeBtn?.removeEventListener('click', toggleChatbot);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom of chatbox when messages change
    chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
  }, [messages]);

  return (
    <div
      className="chatbot-container"
      style={{
        background: primaryColor,
        backgroundColor: primaryColor,
      }}
    >
      <button
        className="chatbot-toggler"
        onClick={toggleChatbot}
        style={{ background: primaryColor }}
      >
        <span className="material-symbols-rounded">{chatIcon}</span>
        <span className="material-symbols-outlined">Close</span>
      </button>
      <div className="chatbot">
        <header style={{ background: primaryColor }}>
          <h2>{chatbotName}</h2>
          <span className="close-btn material-symbols-outlined" onClick={toggleChatbot}>
            close
          </span>
        </header>
        <ul className="chatbox" ref={chatboxRef}>
          {messages.map((msg, index) => (
            <li key={index} className={`chat ${msg.role === 'user' ? 'outgoing' : 'incoming'}`}>
              {msg.role !== 'user' && <span className="material-symbols-outlined">{botIcon}</span>}
              <p
                style={
                  msg.role === 'assistant'
                    ? botFontStyle
                    : msg.role === 'error'
                      ? botFontStyle
                      : { background: primaryColor }
                }
                {...(useInnerHTML
                  ? { dangerouslySetInnerHTML: { __html: msg.content } }
                  : { children: msg.content })}
              />
            </li>
          ))}
          {typing && (
            <li key={Date.now()} className="chat incoming">
              <span className="material-symbols-outlined">{botIcon}</span>
              <p style={typingFontStyle}>{isTypingMessage}</p>
            </li>
          )}
        </ul>
        <div className="chat-input">
          <textarea
            ref={chatInputRef}
            placeholder={inputMsgPlaceholder}
            spellCheck="false"
            required
            value={userMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            maxLength={500}
          />
          <span
            id="send-btn"
            className="material-symbols-outlined"
            onClick={handleChat}
            style={{
              color: primaryColor,
            }}
          >
            send
          </span>
        </div>
      </div>
    </div>
  );
};

const ChatIcon = () => {
  return <Bot />;
};

const BotIcon = () => {
  return <BotMessageSquare />;
};

export default ChatBotWidget;
