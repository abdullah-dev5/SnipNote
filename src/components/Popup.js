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
    return (_jsxs("div", { children: [_jsx("input", { type: "text", placeholder: "Enter link", value: link, onChange: (e) => setLink(e.target.value) }), _jsx("textarea", { placeholder: "Enter note", value: note, onChange: (e) => setNote(e.target.value) }), _jsx("button", { onClick: handleSave, children: "Save Note" }), _jsx("button", { onClick: downloadFile, children: "Download Notes as TXT" }), _jsx("button", { onClick: handleClearAll, style: { backgroundColor: 'red', marginLeft: '10px' }, children: "Clear All" }), _jsx("div", { children: savedNotes.map((item, index) => (_jsxs("div", { children: [_jsx("a", { href: item.link, target: "_blank", rel: "noopener noreferrer", children: item.link }), _jsx("p", { children: item.note })] }, index))) })] }));
};
export default Popup;
