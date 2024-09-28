import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './components/Popup';
import './index.css';
const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(_jsx(React.StrictMode, { children: _jsx(Popup, {}) }));
}
