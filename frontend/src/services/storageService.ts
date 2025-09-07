// Local Storage Service to replace backend database functionality
// Stores message history, user preferences, and analytics data in browser storage

export interface StoredMessage {
  _id: string;
  userPrompt: string;
  generatedMessage: string;
  templateUsed: string;
  category: string;
  isEdited: boolean;
  finalMessage?: string;
  createdAt: string;
  confidence?: number;
  variables?: string[];
}

export interface UserPreferences {
  preferredStyle: 'professional' | 'friendly' | 'casual' | 'formal';
  defaultBusinessName?: string;
  favoriteCategories: string[];
  apiProvider: 'openai' | 'huggingface' | 'template';
}

export interface Analytics {
  totalMessagesGenerated: number;
  categoryCounts: { [key: string]: number };
  dailyUsage: { [key: string]: number };
  mostUsedTemplates: { [key: string]: number };
  lastUpdated: string;
}

class StorageService {
  private readonly MESSAGES_KEY = 'message_generator_messages';
  private readonly PREFERENCES_KEY = 'message_generator_preferences';
  private readonly ANALYTICS_KEY = 'message_generator_analytics';

  // Message History Operations
  
  saveMessage(message: Omit<StoredMessage, '_id' | 'createdAt'>): StoredMessage {
    const storedMessage: StoredMessage = {
      ...message,
      _id: this.generateId(),
      createdAt: new Date().toISOString()
    };

    const messages = this.getMessages();
    messages.unshift(storedMessage); // Add to beginning
    
    // Keep only the latest 100 messages to prevent storage bloat
    if (messages.length > 100) {
      messages.splice(100);
    }

    localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messages));
    this.updateAnalytics(storedMessage);
    
    return storedMessage;
  }

  getMessages(limit?: number): StoredMessage[] {
    try {
      const messagesJson = localStorage.getItem(this.MESSAGES_KEY);
      if (!messagesJson) return [];
      
      const messages: StoredMessage[] = JSON.parse(messagesJson);
      return limit ? messages.slice(0, limit) : messages;
    } catch (error) {
      console.error('Error loading messages from storage:', error);
      return [];
    }
  }

  updateMessage(messageId: string, updates: Partial<StoredMessage>): boolean {
    try {
      const messages = this.getMessages();
      const messageIndex = messages.findIndex(m => m._id === messageId);
      
      if (messageIndex === -1) return false;
      
      messages[messageIndex] = { ...messages[messageIndex], ...updates };
      localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messages));
      
      return true;
    } catch (error) {
      console.error('Error updating message:', error);
      return false;
    }
  }

  deleteMessage(messageId: string): boolean {
    try {
      const messages = this.getMessages();
      const filteredMessages = messages.filter(m => m._id !== messageId);
      
      localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(filteredMessages));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // User Preferences Operations
  
  getPreferences(): UserPreferences {
    try {
      const preferencesJson = localStorage.getItem(this.PREFERENCES_KEY);
      if (!preferencesJson) {
        return this.getDefaultPreferences();
      }
      
      return { ...this.getDefaultPreferences(), ...JSON.parse(preferencesJson) };
    } catch (error) {
      console.error('Error loading preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  savePreferences(preferences: Partial<UserPreferences>): void {
    try {
      const currentPreferences = this.getPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      preferredStyle: 'friendly',
      favoriteCategories: [],
      apiProvider: 'template'
    };
  }

  // Analytics Operations
  
  getAnalytics(): Analytics {
    try {
      const analyticsJson = localStorage.getItem(this.ANALYTICS_KEY);
      if (!analyticsJson) {
        return this.getDefaultAnalytics();
      }
      
      return JSON.parse(analyticsJson);
    } catch (error) {
      console.error('Error loading analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  private updateAnalytics(message: StoredMessage): void {
    try {
      const analytics = this.getAnalytics();
      
      // Update totals
      analytics.totalMessagesGenerated++;
      
      // Update category counts
      analytics.categoryCounts[message.category] = (analytics.categoryCounts[message.category] || 0) + 1;
      
      // Update daily usage
      const today = new Date().toISOString().split('T')[0];
      analytics.dailyUsage[today] = (analytics.dailyUsage[today] || 0) + 1;
      
      // Update template usage
      analytics.mostUsedTemplates[message.templateUsed] = (analytics.mostUsedTemplates[message.templateUsed] || 0) + 1;
      
      analytics.lastUpdated = new Date().toISOString();
      
      localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  private getDefaultAnalytics(): Analytics {
    return {
      totalMessagesGenerated: 0,
      categoryCounts: {},
      dailyUsage: {},
      mostUsedTemplates: {},
      lastUpdated: new Date().toISOString()
    };
  }

  // Search and Filter Operations
  
  searchMessages(query: string): StoredMessage[] {
    const messages = this.getMessages();
    const queryLower = query.toLowerCase();
    
    return messages.filter(message => 
      message.userPrompt.toLowerCase().includes(queryLower) ||
      message.generatedMessage.toLowerCase().includes(queryLower) ||
      message.category.toLowerCase().includes(queryLower) ||
      message.templateUsed.toLowerCase().includes(queryLower)
    );
  }

  getMessagesByCategory(category: string): StoredMessage[] {
    const messages = this.getMessages();
    return messages.filter(message => message.category === category);
  }

  getMessagesByDateRange(startDate: Date, endDate: Date): StoredMessage[] {
    const messages = this.getMessages();
    return messages.filter(message => {
      const messageDate = new Date(message.createdAt);
      return messageDate >= startDate && messageDate <= endDate;
    });
  }

  // Export/Import Operations
  
  exportData(): string {
    const data = {
      messages: this.getMessages(),
      preferences: this.getPreferences(),
      analytics: this.getAnalytics(),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.messages) {
        localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(data.messages));
      }
      
      if (data.preferences) {
        localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(data.preferences));
      }
      
      if (data.analytics) {
        localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(data.analytics));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Utility Operations
  
  clearAllData(): void {
    localStorage.removeItem(this.MESSAGES_KEY);
    localStorage.removeItem(this.PREFERENCES_KEY);
    localStorage.removeItem(this.ANALYTICS_KEY);
  }

  getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let totalBytes = 0;
      
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalBytes += localStorage[key].length + key.length;
        }
      }
      
      // Most browsers have a 5-10MB limit for localStorage
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      
      return {
        used: totalBytes,
        total: estimatedLimit,
        percentage: Math.round((totalBytes / estimatedLimit) * 100)
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

export const storageService = new StorageService();
