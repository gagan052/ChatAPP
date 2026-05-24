import React from 'react';
import { Outlet } from 'react-router-dom';
import { ChatProvider } from './ChatContext';

const Layout: React.FC = () => {
  return (
    <ChatProvider>
      <Outlet />
    </ChatProvider>
  );
};

export default Layout;
