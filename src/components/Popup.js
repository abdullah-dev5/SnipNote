import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const Popup = () => {
    const [link, setLink] = useState('');
    const [note, setNote] = useState('');
    const [savedNotes, setSavedNotes] = useState([]);
    // Load saved notes from Chrome storage when the component mounts
    useEffect(() => {
        chrome.storage.local.get('notes', (result) => {
            if (result.notes) {
                setSavedNotes(result.notes);
            }
        });
    }, []);
    // Save note and link to local storage
    const handleSave = () => {
        if (link || note) {
            const newNote = { link, note };
            const updatedNotes = [...savedNotes, newNote];
            setSavedNotes(updatedNotes);
            // Save to storage
            chrome.storage.local.set({ notes: updatedNotes }, () => {
                console.log('Notes saved');
            });
            // Clear inputs
            setLink('');
            setNote('');
        }
    };
    // Get the current tab's link and set it in the link input field
    const handleGetCurrentTabLink = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url) {
                setLink(tabs[0].url);
            }
        });
    };
    // Download saved notes as a text file
    const downloadFile = () => {
        const fileContent = savedNotes
            .map((item) => `Link: ${item.link}\nNote: ${item.note}\n\n`)
            .join('');
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    // Clear all notes from storage and state
    const handleClearAll = () => {
        chrome.storage.local.remove('notes', () => {
            console.log('All notes cleared');
            setSavedNotes([]);
        });
    };
    // Delete a specific note
    const handleDeleteNote = (index) => {
        const updatedNotes = savedNotes.filter((_, i) => i !== index);
        setSavedNotes(updatedNotes);
        // Update Chrome storage
        chrome.storage.local.set({ notes: updatedNotes }, () => {
            console.log('Note deleted');
        });
    };
    return (_jsxs("div", { className: "p-6 max-w-md mx-auto bg-gray-800 text-white rounded-lg shadow-md space-y-4", children: [_jsx("input", { type: "text", placeholder: "Enter link", value: link, onChange: (e) => setLink(e.target.value), className: "w-full p-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("textarea", { placeholder: "Enter note", value: note, onChange: (e) => setNote(e.target.value), className: "w-full p-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: handleSave, className: "flex-1 p-2 bg-[#a07ee7] hover:bg-purple-600 rounded-md transition duration-150 ease-in-out", children: "Save Note" }), _jsx("button", { onClick: handleGetCurrentTabLink, className: "flex-1 p-2 bg-purple-600 hover:bg-purple-700 rounded-md transition duration-150 ease-in-out", children: "GetAuto" })] }), _jsx("div", { className: "space-y-2", children: savedNotes.map((item, index) => (_jsxs("div", { className: "p-3 bg-gray-700 rounded-md relative hover:bg-gray-600 transition duration-150 ease-in-out", children: [_jsx("button", { onClick: () => handleDeleteNote(index), className: "absolute top-1 right-1 text-red-300 hover:text-red-400 focus:outline-none", "aria-label": "Delete note", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", className: "w-5 h-5", viewBox: "0 0 24 24", children: _jsx("path", { d: "M6 19c0 1.104.896 2 2 2h8c1.104 0 2-.896 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" }) }) }), _jsxs("div", { children: [_jsx("a", { href: item.link, target: "_blank", rel: "noopener noreferrer", className: "text-blue-400 hover:text-blue-300", children: item.link }), _jsx("p", { className: "text-gray-300", children: item.note })] })] }, index))) }), _jsxs("div", { className: "flex space-x-2 pt-4 border-t border-gray-600", children: [_jsx("button", { onClick: downloadFile, className: "flex-1 p-2 bg-[#a07ee7] hover:bg-purple-500 rounded-md transition duration-150 ease-in-out text-white", children: "Download Notes" }), _jsx("button", { onClick: handleClearAll, className: "flex-1 p-2 bg-red-600 hover:bg-red-700 rounded-md transition duration-150 ease-in-out", children: "Clear All" })] })] }));
};
export default Popup;
