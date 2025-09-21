import React, { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiCopy, FiSave, FiRefreshCw, FiDownload, FiUpload, FiBarChart2, FiSettings, FiTrash2, FiChevronDown, FiChevronUp, FiSun, FiMoon } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { aiService } from '../services/aiService';
import { storageService, StoredMessage } from '../services/storageService';
import AnalyticsDashboard from './AnalyticsDashboard';
import Illustration from './Illustration';
import { useTheme } from '../contexts/ThemeContext';
import 'react-toastify/dist/ReactToastify.css';
import './MessageGenerator.css';
import './EnhancedStyles.css';

interface GeneratedMessage {
  id: string;
  generated_message: string;
  template_used: string;
  variables_detected: string[];
  category: string;
  success: boolean;
  confidence?: number;
}

interface Category {
  name: string;
  display_name: string;
}


// Helper component to render icons properly
const renderIcon = (IconComponent: IconType, className?: string) => {
  return React.createElement(IconComponent as any, { className });
};

const MessageGenerator: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState<GeneratedMessage | null>(null);
  const [editableMessage, setEditableMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [messageHistory, setMessageHistory] = useState<StoredMessage[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const examplePrompts = [
    "I want to send Diwali wishes to my customers",
    "Generate a Christmas greeting for my business clients",
    "Create a birthday message for our valued customer",
    "I need a thank you message for my customers",
    "Generate a welcome message for new customers"
  ];

  const loadCategories = useCallback(() => {
    try {
      const loadedCategories = aiService.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  }, []);

  const loadHistory = useCallback(() => {
    try {
      const history = storageService.getMessages(10);
      setMessageHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load message history');
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadHistory();
  }, [loadCategories, loadHistory]);

  useEffect(() => {
    if (generatedMessage && editableMessage !== generatedMessage.generated_message) {
      setHasEdits(true);
    } else {
      setHasEdits(false);
    }
  }, [editableMessage, generatedMessage]);

  const generateMessage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const result = await aiService.generateMessage({ prompt });
      setGeneratedMessage(result);
      setEditableMessage(result.generated_message);
      setHasEdits(false);

      // Save to local storage
      storageService.saveMessage({
        userPrompt: prompt,
        generatedMessage: result.generated_message,
        templateUsed: result.template_used,
        category: result.category,
        isEdited: false,
        confidence: result.confidence,
        variables: result.variables_detected
      });

      // Reload history to show the new message
      loadHistory();

      toast.success('Message generated successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error: any) {
      console.error('Error generating message:', error);
      toast.error('Error generating message. Please try again.', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveEdit = () => {
    if (!generatedMessage || !hasEdits) return;

    try {
      const success = storageService.updateMessage(generatedMessage.id, {
        finalMessage: editableMessage,
        isEdited: true
      });

      if (success) {
        setGeneratedMessage({ ...generatedMessage, generated_message: editableMessage });
        setHasEdits(false);
        loadHistory();
        toast.success('Message edited and saved!');
      } else {
        toast.error('Failed to save edit');
      }
    } catch (error: any) {
      console.error('Error saving edit:', error);
      toast.error('Error saving edit. Please try again.');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editableMessage);
      toast.success('Message copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Could not copy to clipboard');
    }
  };

  const exportData = () => {
    try {
      const data = storageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `message-generator-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = storageService.importData(jsonData);
        if (success) {
          loadHistory();
          toast.success('Data imported successfully!');
        } else {
          toast.error('Failed to import data');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        toast.error('Invalid data format');
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="message-generator-container">
      <Illustration />
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <motion.div 
        className="main-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="header"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="header-content">
            <h1>
              <span className="emoji-icon">🤖</span>
              AI Message Generator
              <span className="sparkle">✨</span>
            </h1>
            <p>Generate personalized messages using simple prompts</p>
            
            <div className="header-actions">
              <motion.button
                onClick={toggleTheme}
                className={`header-btn theme-btn ${isDark ? 'dark-theme' : 'light-theme'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {renderIcon(isDark ? FiSun : FiMoon)}
                {isDark ? 'Light' : 'Dark'}
              </motion.button>
              <motion.button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="header-btn analytics-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {renderIcon(FiBarChart2)}
                Analytics
              </motion.button>
              <motion.button
                onClick={() => setShowSettings(!showSettings)}
                className="header-btn settings-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {renderIcon(FiSettings)}
                Settings
              </motion.button>
              <motion.button
                onClick={exportData}
                className="header-btn export-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {renderIcon(FiDownload)}
                Export
              </motion.button>
            </div>
          </div>
        </motion.div>

        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <AnalyticsDashboard />
          </motion.div>
        )}

        {/* Prompt Input Section */}
        <motion.div 
          className="input-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <label htmlFor="prompt">
💬
            Describe the message you want to generate
          </label>
          <motion.textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g., I want to send Diwali wishes to my customers"
            rows={3}
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
          
          <div className="input-actions">
            <span className="char-count">
              {prompt.length}/500 characters
            </span>
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.button
          onClick={generateMessage}
          disabled={!prompt.trim() || isGenerating}
          className={`generate-button ${isGenerating ? 'generating' : ''}`}
          whileHover={!isGenerating ? { scale: 1.02, y: -2 } : {}}
          whileTap={!isGenerating ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {isGenerating ? (
            <>
              <div className="spinner-modern" />
              <span>Generating amazing message...</span>
            </>
          ) : (
            <>
✨
              Generate Message
            </>
          )}
        </motion.button>

        {/* Generated Message Section */}
        {generatedMessage && (
          <motion.div 
            className="output-section"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          >
              <div className="output-header">
                <label htmlFor="generated">
💬
                  Generated Message
                  {generatedMessage.confidence && (
                    <span className={`confidence-badge ${generatedMessage.confidence > 0.8 ? 'high' : 'medium'}`}>
                      {Math.round(generatedMessage.confidence * 100)}% confidence
                    </span>
                  )}
                </label>
              </div>
              
              <motion.textarea
                id="generated"
                value={editableMessage}
                onChange={(e) => setEditableMessage(e.target.value)}
                rows={4}
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              />
              
              <div className="message-info">
                <div className="info-text">
                  <div className="info-item">
                    <strong>Template:</strong> 
                    <span className="info-value">{generatedMessage.template_used}</span>
                  </div>
                  <div className="info-item">
                    <strong>Category:</strong> 
                    <span className={`category-badge ${generatedMessage.category.toLowerCase()}`}>
                      {generatedMessage.category}
                    </span>
                  </div>
                </div>
                
                <div className="action-buttons">
                  <motion.button 
                    onClick={copyToClipboard} 
                    className="action-btn copy-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {renderIcon(FiCopy)}
                    Copy
                  </motion.button>
                  
                  {hasEdits && (
                    <motion.button 
                      onClick={saveEdit} 
                      className="action-btn save-btn"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {renderIcon(FiSave)}
                      Save Edit
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Variables Help Section */}
              {generatedMessage.variables_detected && generatedMessage.variables_detected.length > 0 && (
                <motion.div 
                  className="variables-help"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                    <h4>
                      <span className="icon">🔤</span>
                      Variables detected in your message:
                    </h4>
                    <motion.div className="variable-tags">
                      {generatedMessage.variables_detected.map((variable, index) => (
                        <motion.span 
                          key={variable} 
                          className="variable-tag"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          {`{${variable}}`}
                        </motion.span>
                      ))}
                    </motion.div>
                    <p>💡 Replace these placeholders with actual values when using the message.</p>
                  </motion.div>
                )}
              </motion.div>
            )}

        {/* History Section */}
        <motion.div 
          className="history-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="section-header">
            <h3>
              <span className="section-icon">📝</span>
              Recent Messages
            </h3>
            <motion.button 
              onClick={loadHistory} 
              className="action-btn refresh-btn"
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
            >
🔄 Refresh
            </motion.button>
          </div>
          
          {messageHistory.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
                <div className="empty-icon">📨</div>
                <p>No messages generated yet.</p>
                <p>Create your first message above!</p>
              </motion.div>
            ) : (
              <motion.div className="history-list">
                {messageHistory.map((message, index) => (
                  <motion.div 
                    key={message._id} 
                    className="history-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className="history-prompt">
                      <strong>Prompt:</strong> 
                      <span>{message.userPrompt}</span>
                    </div>
                    <div className="history-message">
                      <strong>Generated:</strong> 
                      <span>{message.isEdited ? message.finalMessage : message.generatedMessage}</span>
                    </div>
                    <div className="history-meta">
                      <span className="date">{formatDate(message.createdAt)}</span>
                      <div className="meta-badges">
                        {message.confidence && (
                          <span className="confidence-mini">
                            {Math.round(message.confidence * 100)}%
                          </span>
                        )}
                        {message.isEdited && (
                          <span className="edited-badge">✏️ Edited</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
        </motion.div>
      </motion.div>

      {/* Enhanced Sidebar */}
      <motion.div 
        className="sidebar"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Categories Section */}
        <motion.div 
          className="sidebar-section"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <h3>
            <span className="section-icon">📂</span>
            Available Categories
          </h3>
          <div className="category-list">
            {categories.map((category, index) => (
              <motion.div 
                key={category.name} 
                className="category-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, x: 5 }}
              >
                <div className="category-name">
                  <span className="category-emoji">✨</span>
                  {category.display_name}
                </div>
                <div className="category-desc">Smart template matching</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Example Prompts Section */}
        <motion.div 
          className="sidebar-section"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <h4>
            <span className="section-icon">💡</span>
            Example Prompts
          </h4>
          <div className="example-list">
            {examplePrompts.map((example, index) => (
              <motion.div
                key={index}
                onClick={() => setPrompt(example)}
                className="example-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.03, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="quote-icon">"</span>
                {example}
                <span className="quote-icon">"</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Tools Section */}
        <motion.div 
          className="sidebar-section quick-tools"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <h4>
            <span className="section-icon">⚡</span>
            Quick Tools
          </h4>
          <div className="tools-grid">
            <motion.button
              className="tool-btn"
              onClick={() => setPrompt('')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="tool-icon">🧹</span>
              Clear
            </motion.button>
            <motion.label
              className="tool-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <input
                type="file"
                accept=".json"
                onChange={importData}
                style={{ display: 'none' }}
              />
📤
              Import
            </motion.label>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MessageGenerator;
