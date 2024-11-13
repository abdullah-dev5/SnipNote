import React, { useEffect, useState } from 'react';

const Popup: React.FC = () => {
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [savedNotes, setSavedNotes] = useState<{ link: string; note: string }[]>([]);

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
  const handleDeleteNote = (index: number) => {
    const updatedNotes = savedNotes.filter((_, i) => i !== index);
    setSavedNotes(updatedNotes);

    // Update Chrome storage
    chrome.storage.local.set({ notes: updatedNotes }, () => {
      console.log('Note deleted');
    });
  };

  return (
    <div className="p-6 max-w-sm mx-auto bg-gray-800 text-white rounded-lg shadow-md space-y-4">
      <input
        type="text"
        placeholder="Enter link"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className="w-full p-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        placeholder="Enter note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full p-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 break-words whitespace-pre-wrap"
      />
      
      <div className="flex space-x-2">
        <button
          onClick={handleSave}
          className="flex-1 p-2 bg-[#a07ee7] hover:bg-purple-600 rounded-md transition duration-150 ease-in-out"
        >
          Save Note
        </button>
        <button
          onClick={handleGetCurrentTabLink}
          className="flex-1 p-2 bg-purple-600 hover:bg-purple-700 rounded-md transition duration-150 ease-in-out"
        >
          GetAuto
        </button>
      </div>

      <div className="space-y-2 scrollable max-h-64">
        {savedNotes.map((item, index) => (
          <div key={index} className="p-3 bg-gray-700 rounded-md relative hover:bg-gray-600 transition duration-150 ease-in-out">
            <button
              onClick={() => handleDeleteNote(index)}
              className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-transparent rounded-full hover:bg-gray-600 focus:outline-none"
              aria-label="Delete note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-4 h-4 text-red-300 hover:text-red-400" viewBox="0 0 24 24">
                <path d="M6 19c0 1.104.896 2 2 2h8c1.104 0 2-.896 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
            <div>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 break-words whitespace-pre-wrap"
              >
                {item.link}
              </a>
              <p className="text-gray-300 break-words whitespace-pre-wrap">{item.note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2 pt-4 border-t border-gray-600">
        <button
          onClick={downloadFile}
          className="flex-1 p-2 bg-[#a07ee7] hover:bg-purple-500 rounded-md transition duration-150 ease-in-out text-white"
        >
          Download Notes
        </button>
        <button
          onClick={handleClearAll}
          className="flex-1 p-2 bg-red-600 hover:bg-red-700 rounded-md transition duration-150 ease-in-out"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default Popup;
