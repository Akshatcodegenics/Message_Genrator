const express = require('express');
const MessageGeneratorService = require('../services/messageService');

const router = express.Router();
const messageService = new MessageGeneratorService();

// POST /api/messages/generate
router.post('/generate', async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }
    
    const result = await messageService.generateMessage(prompt, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/messages/categories
router.get('/categories', (req, res) => {
  try {
    const categories = [
      { name: 'diwali', display_name: 'Diwali' },
      { name: 'christmas', display_name: 'Christmas' },
      { name: 'birthday', display_name: 'Birthday' },
      { name: 'new_year', display_name: 'New Year' },
      { name: 'general', display_name: 'General' }
    ];
    
    res.json({ categories });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/messages/templates
router.get('/templates', (req, res) => {
  try {
    const templates = messageService.getAllTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/messages/edit
router.post('/edit', async (req, res) => {
  try {
    const { messageId, editedMessage } = req.body;
    
    if (!messageId || !editedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Message ID and edited message are required'
      });
    }
    
    const success = await messageService.editGeneratedMessage(messageId, editedMessage);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Message updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/messages/history
router.get('/history', async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;
    const messages = await messageService.getMessageHistory(userId, parseInt(limit));
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/messages/test - Test endpoint with examples
router.post('/test', async (req, res) => {
  try {
    const examplePrompts = [
      "I want to send Diwali wishes to my customers",
      "Generate a Christmas greeting for my business clients",
      "Create a birthday message for our valued customer",
      "I need a thank you message for my customers",
      "Generate a welcome message for new customers"
    ];
    
    const results = [];
    
    for (const prompt of examplePrompts) {
      try {
        const result = await messageService.generateMessage(prompt);
        results.push({
          prompt: prompt,
          result: result
        });
      } catch (error) {
        results.push({
          prompt: prompt,
          error: error.message
        });
      }
    }
    
    res.json({ examples: results });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
