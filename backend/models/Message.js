const mongoose = require('mongoose');

// Schema for message templates
const messageTemplateSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['diwali', 'christmas', 'birthday', 'new_year', 'general']
  },
  templateName: {
    type: String,
    required: true
  },
  templateContent: {
    type: String,
    required: true
  },
  variables: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Schema for generated messages
const generatedMessageSchema = new mongoose.Schema({
  userPrompt: {
    type: String,
    required: true
  },
  generatedMessage: {
    type: String,
    required: true
  },
  templateUsed: String,
  category: String,
  variablesDetected: [String],
  isEdited: {
    type: Boolean,
    default: false
  },
  finalMessage: String,
  userId: String, // For future user authentication
}, {
  timestamps: true
});

const MessageTemplate = mongoose.model('MessageTemplate', messageTemplateSchema);
const GeneratedMessage = mongoose.model('GeneratedMessage', generatedMessageSchema);

module.exports = {
  MessageTemplate,
  GeneratedMessage
};
