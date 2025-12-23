import React from "react";
import styles from "./MessageBoard.module.scss";

interface MessageBoardProps {
  children: React.ReactNode;
}

const MessageBoard: React.FC<MessageBoardProps> = ({ children }) => {
  return <div className={styles.messageBoard}>{children}</div>;
};

export default MessageBoard;
