import React from 'react';
import MessageGenerator from './components/MessageGenerator';
import './App.css';
import ParticleBackground from './components/ParticleBackground';
import ThreeBackground from './components/ThreeBackground';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        {/* Background layers */}
        <ThreeBackground />
        <ParticleBackground />
        <MessageGenerator />
      </div>
    </ThemeProvider>
  );
}

export default App;
