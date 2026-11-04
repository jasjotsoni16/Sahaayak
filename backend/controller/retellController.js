const Retell = require('retell-sdk');

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});

const handleRetellAuth = async (req, res) => {
  try {
    const { context = 'general' } = req.body;
    
    // You can customize agent behavior based on context
    const agentConfig = {
      agent_id: process.env.RETELL_AGENT_ID || 'agent_cddbdef68cf6796ee7258beaee',
      // Add context-specific metadata if needed
      metadata: {
        context,
        timestamp: new Date().toISOString(),
        user_agent: req.headers['user-agent'] || 'unknown'
      }
    };
    
    console.log(`Creating Retell call for context: ${context}`);
    
    const response = await retell.call.createWebCall(agentConfig);
    
    // Log successful call creation
    console.log(`Retell call created successfully: ${response.call_id}`);
    
    res.json(response);
  } catch (error) {
    console.error('Retell API Error:', error);
    res.status(500).json({ 
      error: 'Failed to create Retell call',
      details: error.message 
    });
  }
};

module.exports = { handleRetellAuth };