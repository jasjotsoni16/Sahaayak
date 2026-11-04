
const LoanSuggestion = require('../Model/LoanSuggestion');
const User = require('../Model/User');
const UserSkill = require('../Model/UserSkill');
const CreditScore = require('../Model/creditScore');
const axios = require('axios');
const NotificationService = require('./notificationService');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Map skills to business search terms
const getBusinessSearchTerms = (skillName) => {
  const skillBusinessMap = {
    'cooking': ['restaurant', 'cafe', 'bakery', 'catering', 'food_truck'],
    'driving': ['taxi_stand', 'car_rental', 'delivery_service', 'logistics'],
    'cleaning': ['laundry', 'dry_cleaning', 'cleaning_service', 'car_wash'],
    'mechanic': ['car_repair', 'auto_parts_store', 'garage', 'service_station'],
    'plumbing': ['hardware_store', 'plumbing_supply', 'home_improvement'],
    'electric_work': ['electronics_store', 'electrical_supply', 'home_improvement'],
    'gardening': ['garden_center', 'nursery', 'landscaping', 'plant_store'],
    'painting': ['paint_store', 'hardware_store', 'home_improvement'],
    'security_guards': ['security_service', 'office_building', 'shopping_mall'],
    'waiter': ['restaurant', 'cafe', 'bar', 'hotel'],
    'bartending': ['bar', 'restaurant', 'hotel', 'club'],
    'carpentering': ['hardware_store', 'furniture_store', 'home_improvement'],
    'construction': ['hardware_store', 'building_materials', 'construction_company'],
    'tailoring': ['clothing_store', 'fabric_store', 'fashion_boutique'],
    'beauty': ['beauty_salon', 'spa', 'cosmetics_store'],
    'massage': ['spa', 'wellness_center', 'massage_parlor'],
    'teaching': ['school', 'tutoring_center', 'educational_services'],
    'computer': ['electronics_store', 'computer_store', 'it_services'],
    'photography': ['photo_studio', 'camera_store', 'event_planning'],
    'music': ['music_store', 'recording_studio', 'entertainment_venue']
  };
  
  // Default to general business types if skill not mapped
  return skillBusinessMap[skillName.toLowerCase()] || ['store', 'service', 'business'];
};

const fetchBusinessFromMaps = async (userLocation, skillName) => {
  console.log(`Attempting to fetch business from Google Maps for skill: ${skillName}...`);
  
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY is not set in environment variables.');
      return { 
        name: `${skillName} Business Opportunity`, 
        purpose: `Start a ${skillName.toLowerCase()}-related business` 
      };
    }

    if (!userLocation || !userLocation.coordinates || userLocation.coordinates.length < 2) {
      console.warn('User location coordinates are missing or invalid. Using skill-based business.');
      return { 
        name: `${skillName} Business Opportunity`, 
        purpose: `Start a ${skillName.toLowerCase()}-related business` 
      };
    }

    const businessTypes = getBusinessSearchTerms(skillName);
    const randomBusinessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        key: GOOGLE_PLACES_API_KEY,
        location: `${userLocation.coordinates[1]},${userLocation.coordinates[0]}`, // lat,lng
        radius: 5000,
        type: randomBusinessType,
        keyword: skillName
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const businesses = response.data.results;
      const selectedBusiness = businesses[Math.floor(Math.random() * Math.min(3, businesses.length))];
      const businessPurpose = `Start or expand a ${skillName.toLowerCase()}-related business similar to ${selectedBusiness.name}.`;

      console.log(`Successfully fetched business from Google Maps for ${skillName}:`, selectedBusiness.name);
      
      return {
        name: selectedBusiness.name,
        purpose: businessPurpose,
      };
    } else {
      console.log(`No businesses found for ${skillName}. Using skill-based business.`);
      return { 
        name: `${skillName} Business Opportunity`, 
        purpose: `Start a ${skillName.toLowerCase()}-related business in your area` 
      };
    }
  } catch (error) {
    console.error('Error fetching business from Google Maps API:', error.message);
    return { 
      name: `${skillName} Business Opportunity`, 
      purpose: `Start a ${skillName.toLowerCase()}-related business` 
    };
  }
};

const generateLoanSuggestion = async (userId) => {
  console.log(`Generating loan suggestions for user ${userId}...`);
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User with ID ${userId} not found.`);
      return null;
    }

    // Get user's credit score (fix field name issue)
    const creditScoreDoc = await CreditScore.findOne({ user_id: userId });
    const creditScore = creditScoreDoc ? creditScoreDoc.score : 0;
    
    // Monthly savings goal is part of the user's profile
    const monthlySavings = user.monthlySavings || 0;

    console.log(`User ${userId} details: Credit Score = ${creditScore}, Monthly Savings Goal = ${monthlySavings}`);

    // Get user's skills
    const userSkills = await UserSkill.find({ user_id: userId })
      .populate('skill_id', 'name')
      .exec();

    if (!userSkills || userSkills.length === 0) {
      console.log(`No skills found for user ${userId}. Cannot generate loan suggestions.`);
      return null;
    }

    console.log(`Found ${userSkills.length} skills for user ${userId}`);

    // Check for existing loan suggestions to avoid duplicates
    const existingSuggestions = await LoanSuggestion.find({ userId });
    const existingSkillIds = existingSuggestions.map(suggestion => suggestion.skillId.toString());

    const loanTermYears = 5;
    const baseInterestRate = 15;
    const createdSuggestions = [];

    // Generate one loan suggestion per skill (if not already exists)
    for (const userSkill of userSkills) {
      const skillId = userSkill.skill_id._id;
      const skillName = userSkill.skill_id.name;

      // Skip if suggestion already exists for this skill
      if (existingSkillIds.includes(skillId.toString())) {
        console.log(`Loan suggestion already exists for skill: ${skillName}. Skipping.`);
        continue;
      }

      console.log(`Generating loan suggestion for skill: ${skillName}`);

      // Fetch business based on skill
      const business = await fetchBusinessFromMaps(user.location, skillName);

      // Calculate suggested amount based on credit score and skill experience
      let suggestedAmount = 0;
      
      // Base amount based on credit score
      if (creditScore >= 80) {
        suggestedAmount += 500000;
      } else if (creditScore >= 60) {
        suggestedAmount += 200000;
      } else if (creditScore >= 40) {
        suggestedAmount += 100000;
      } else {
        suggestedAmount += 50000;
      }

      // Additional amount based on monthly savings
      suggestedAmount += monthlySavings * 12 * loanTermYears;

      // Skill experience bonus (up to 20% more for experienced users)
      const experienceBonus = Math.min(userSkill.experience_years * 0.05, 0.2);
      suggestedAmount *= (1 + experienceBonus);

      // Verification bonus (10% more for verified skills)
      if (userSkill.is_verified) {
        suggestedAmount *= 1.1;
      }

      const newLoanSuggestion = new LoanSuggestion({
        userId,
        skillId,
        skillName,
        businessName: business.name,
        businessPurpose: business.purpose,
        suggestedAmount: Math.round(suggestedAmount / 1000) * 1000,
        loanTermYears,
        interestRate: baseInterestRate,
        creditScoreAtSuggestion: creditScore,
        monthlySavingsAtSuggestion: monthlySavings,
      });

      console.log(`Attempting to save loan suggestion for skill ${skillName}:`, {
        skillName,
        businessName: business.name,
        suggestedAmount: newLoanSuggestion.suggestedAmount,
        creditScore
      });
      
      await newLoanSuggestion.save();
      createdSuggestions.push(newLoanSuggestion);
      
      // Send notification about new loan suggestion
      try {
        await NotificationService.notifyLoanSuggestion(userId, newLoanSuggestion);
      } catch (notificationError) {
        console.error('Error sending loan suggestion notification:', notificationError);
      }
      
      console.log(`Loan suggestion saved successfully for skill: ${skillName}`);
    }

    console.log(`Generated ${createdSuggestions.length} new loan suggestions for user ${userId}`);
    return createdSuggestions;
    
  } catch (error) {
    console.error(`Error generating loan suggestions for user ${userId}:`, error.message);
    return null;
  }
};

module.exports = { generateLoanSuggestion };
