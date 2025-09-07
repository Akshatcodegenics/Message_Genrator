const { GeneratedMessage } = require('../models/Message');

class MessageGeneratorService {
  constructor() {
    this.predefinedTemplates = {
      diwali: [
        {
          name: "Diwali Business Greeting",
          template: "Hello {name}, Wishing you a very Happy Diwali! May this festival of lights bring prosperity and joy to you and your family. {company_name} wishes you the best!",
          variables: ["name", "company_name"]
        },
        {
          name: "Diwali Customer Wishes",
          template: "Dear {name}, Diwali greetings from all of us at {company_name}! May your life be filled with happiness, wealth, and success. Happy Diwali!",
          variables: ["name", "company_name"]
        },
        {
          name: "Simple Diwali Greeting",
          template: "Hello {name}, Diwali greetings! We wish you the best holiday. Namaste!",
          variables: ["name"]
        }
      ],
      christmas: [
        {
          name: "Christmas Business Greeting",
          template: "Dear {name}, Merry Christmas and Happy New Year! May this festive season bring you joy, peace, and prosperity. Best regards from {company_name}.",
          variables: ["name", "company_name"]
        },
        {
          name: "Christmas Customer Wishes",
          template: "Hello {name}, Wishing you a Merry Christmas filled with love, laughter, and wonderful memories. Thank you for being a valued customer!",
          variables: ["name"]
        }
      ],
      birthday: [
        {
          name: "Birthday Business Greeting",
          template: "Happy Birthday, {name}! Hope your special day is filled with happiness, laughter, and wonderful surprises. Best wishes from all of us at {company_name}!",
          variables: ["name", "company_name"]
        },
        {
          name: "Simple Birthday Wish",
          template: "Happy Birthday, {name}! Wishing you a fantastic year ahead filled with success and happiness!",
          variables: ["name"]
        }
      ],
      new_year: [
        {
          name: "New Year Business Greeting",
          template: "Dear {name}, Happy New Year! May this year bring you new opportunities, success, and happiness. Thank you for your continued support. Best regards, {company_name}.",
          variables: ["name", "company_name"]
        }
      ],
      general: [
        {
          name: "Thank You Message",
          template: "Dear {name}, Thank you for your business and support. We appreciate your trust in {company_name} and look forward to serving you better.",
          variables: ["name", "company_name"]
        },
        {
          name: "Welcome Message",
          template: "Hello {name}, Welcome to {company_name}! We're excited to have you on board. If you have any questions, please don't hesitate to reach out.",
          variables: ["name", "company_name"]
        }
      ]
    };
  }

  extractKeywordsFromPrompt(prompt) {
    const promptLower = prompt.toLowerCase();
    
    // Category detection
    let category = "general";
    if (this.containsAny(promptLower, ["diwali", "deepavali", "festival of lights"])) {
      category = "diwali";
    } else if (this.containsAny(promptLower, ["christmas", "xmas", "festive season"])) {
      category = "christmas";
    } else if (this.containsAny(promptLower, ["birthday", "birth day", "special day"])) {
      category = "birthday";
    } else if (this.containsAny(promptLower, ["new year", "newyear"])) {
      category = "new_year";
    } else if (this.containsAny(promptLower, ["welcome", "onboard", "join"])) {
      category = "general";
    } else if (this.containsAny(promptLower, ["thank", "appreciate", "grateful"])) {
      category = "general";
    }
    
    // Extract potential variable names
    const variables = [];
    if (this.containsAny(promptLower, ["customer", "client", "name"])) {
      variables.push("name");
    }
    if (this.containsAny(promptLower, ["company", "business", "organization", "team"])) {
      variables.push("company_name");
    }
    
    return { category, variables };
  }

  containsAny(text, words) {
    return words.some(word => text.includes(word));
  }

  generateMessageFromTemplate(category, detectedVariables, prompt = "") {
    const templates = this.predefinedTemplates[category] || this.predefinedTemplates["general"];
    
    // For general category, choose based on prompt keywords
    if (category === "general") {
      const promptLower = prompt.toLowerCase();
      if (this.containsAny(promptLower, ["welcome", "onboard", "join"])) {
        // Find welcome template
        const welcomeTemplate = templates.find(template => template.name.includes("Welcome"));
        if (welcomeTemplate) {
          return {
            templateName: welcomeTemplate.name,
            message: welcomeTemplate.template,
            variables: welcomeTemplate.variables
          };
        }
      } else if (this.containsAny(promptLower, ["thank", "appreciate", "grateful"])) {
        // Find thank you template
        const thankYouTemplate = templates.find(template => template.name.includes("Thank You"));
        if (thankYouTemplate) {
          return {
            templateName: thankYouTemplate.name,
            message: thankYouTemplate.template,
            variables: thankYouTemplate.variables
          };
        }
      }
    }
    
    // Find template that best matches detected variables
    let bestTemplate = templates[0]; // Default to first template
    
    for (const template of templates) {
      const templateVars = template.variables;
      if (detectedVariables.every(variable => templateVars.includes(variable))) {
        bestTemplate = template;
        break;
      }
    }
    
    return {
      templateName: bestTemplate.name,
      message: bestTemplate.template,
      variables: bestTemplate.variables
    };
  }

  async generateMessage(prompt, userId = null) {
    try {
      // Extract category and variables from prompt
      const { category, variables } = this.extractKeywordsFromPrompt(prompt);
      
      // Generate message from template
      const result = this.generateMessageFromTemplate(category, variables, prompt);
      
      // Save to database if connected
      let savedMessage = null;
      try {
        savedMessage = new GeneratedMessage({
          userPrompt: prompt,
          generatedMessage: result.message,
          templateUsed: result.templateName,
          category: category,
          variablesDetected: result.variables,
          userId: userId
        });
        
        await savedMessage.save();
      } catch (dbError) {
        console.log('Warning: Could not save to database:', dbError.message);
        // Continue without database
      }
      
      return {
        id: savedMessage ? savedMessage._id : Date.now(),
        generated_message: result.message,
        template_used: result.templateName,
        variables_detected: result.variables,
        category: category,
        success: true
      };
    } catch (error) {
      throw new Error(`Error generating message: ${error.message}`);
    }
  }

  getAllTemplates() {
    const templates = [];
    for (const [category, categoryTemplates] of Object.entries(this.predefinedTemplates)) {
      for (const template of categoryTemplates) {
        templates.push({
          category: category,
          templateName: template.name,
          templateContent: template.template,
          variables: template.variables
        });
      }
    }
    return templates;
  }

  async editGeneratedMessage(messageId, editedMessage) {
    try {
      const message = await GeneratedMessage.findById(messageId);
      if (!message) {
        return false;
      }
      
      message.finalMessage = editedMessage;
      message.isEdited = true;
      await message.save();
      return true;
    } catch (error) {
      console.log('Warning: Could not update message in database:', error.message);
      return false;
    }
  }

  async getMessageHistory(userId = null, limit = 50) {
    try {
      let query = {};
      if (userId) {
        query.userId = userId;
      }
      
      const messages = await GeneratedMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);
      
      return messages;
    } catch (error) {
      console.log('Warning: Could not fetch message history:', error.message);
      return [];
    }
  }
}

module.exports = MessageGeneratorService;
