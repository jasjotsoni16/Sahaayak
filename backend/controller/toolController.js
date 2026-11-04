const Tool = require('../Model/Tool');

exports.createTool = async (req, res) => {
  try {
    const newTool = new Tool({
      owner_id: req.user._id, // Assuming user ID is available from authentication middleware
      name: req.body.name,
      description: req.body.description,
      skill_id: req.body.skill_id,
      condition: req.body.condition,
      price_per_day: req.body.price_per_day,
      deposit: req.body.deposit,
      location: req.body.location,
      images: req.body.images || [],
    });
    const tool = await newTool.save();
    res.status(201).json(tool);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    // Ensure only the owner can update the tool
    if (tool.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedTool = await Tool.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedTool);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllTools = async (req, res) => {
  try {
    const tools = await Tool.find().populate('skill_id', 'name');
    res.status(200).json(tools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getToolById = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id).populate('skill_id', 'name');
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    res.status(200).json(tool);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyTools = async (req, res) => {
  try {
    const tools = await Tool.find({ owner_id: req.params.userId }).populate('skill_id', 'name');
    res.status(200).json(tools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    // Ensure only the owner can delete the tool
    if (tool.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Tool.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Tool deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
