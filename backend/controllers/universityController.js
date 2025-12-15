const University = require('../models/University');

const getUniversityConfig = async (req, res) => {
  try {
    let university = await University.findOne({ isActive: true });
    
    if (!university) {
      university = await University.create({
        name: 'Vignan Foundation for Science, Technology and Research',
        tagline: 'VFSTR • Excellence in Innovation and Learning',
        logoUrl: 'https://i.imgur.com/placeholder.png',
        primaryColor: '#7B68B3'
      });
    }
    
    res.json({
      name: university.name,
      tagline: university.tagline,
      logoUrl: university.logoUrl,
      primaryColor: university.primaryColor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUniversityConfig = async (req, res) => {
  try {
    const { name, tagline, logoUrl, primaryColor } = req.body;
    
    let university = await University.findOne({ isActive: true });
    
    if (!university) {
      university = new University({ name, tagline, logoUrl, primaryColor });
    } else {
      university.name = name || university.name;
      university.tagline = tagline || university.tagline;
      university.logoUrl = logoUrl || university.logoUrl;
      university.primaryColor = primaryColor || university.primaryColor;
    }
    
    await university.save();
    res.json(university);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUniversityConfig, updateUniversityConfig };