import React from 'react';
import './ConvenienceLinks.css'; // Import the CSS file

const ConvenienceLinks = () => {
  return (
    <div className="convenience-links-container">
      <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="convenience-link" title="GitHub">
        GH {/* <span className="icon-emoji">🐙</span> */}
      </a>
      <a href="https://code.visualstudio.com/" target="_blank" rel="noopener noreferrer" className="convenience-link" title="VSCode">
        VS {/* <span className="icon-emoji">💻</span> */}
      </a>
      <a href="#jules-placeholder" className="convenience-link" title="Jules">
        JU {/* <span className="icon-emoji">✨</span> */}
      </a>
      <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="convenience-link" title="ChatGPT">
        GPT {/* <span className="icon-emoji">🧠</span> */}
      </a>
    </div>
  );
};

export default ConvenienceLinks;
