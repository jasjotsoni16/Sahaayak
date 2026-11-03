const mongoose = require('mongoose');
require('dotenv').config();
const Skill = require('../Model/Skill');
const AssessmentQuestion = require('../Model/AssessmentQuestion');

// Skills data with colors
const skillsData = [
  { name: 'driving', category: ['2w', '3w', '4w'], color: '#3b82f6' },
  { name: 'cooking', category: ['baker', 'chef'], color: '#f59e42' },
  { name: 'mechanic', category: ['2w', '3w', '4w'], color: '#6366f1' },
  { name: 'waiter', color: '#10b981' },
  { name: 'vehicle_cleaning', color: '#f472b6' },
  { name: 'cleaning', color: '#a3e635' },
  { name: 'bartending', color: '#fbbf24' },
  { name: 'dishwashing', color: '#818cf8' },
  { name: 'laundry', color: '#f87171' },
  { name: 'gardening', color: '#22d3ee' },
  { name: 'plumbing', color: '#0ea5e9' },
  { name: 'carpentering', color: '#facc15' },
  { name: 'painting', color: '#a21caf' },
  { name: 'electric_work', color: '#f43f5e' },
  { name: 'electronic_repair', category: ['laptop', 'computer', 'mobile', 'speaker', 'mic'], color: '#14b8a6' },
  { name: 'security_guards', color: '#64748b' },
  { name: 'warehouse_works', color: '#f59e42' },
  { name: 'constructor_labour', color: '#b91c1c' }
];

// Question templates for each skill
const questionTemplates = {
  driving: [
    {
      question: "What is the minimum age to get a driving license for a two-wheeler in India?",
      options: ["16 years", "18 years", "21 years", "25 years"],
      correct: 0,
      difficulty: "easy"
    },
    {
      question: "What does a red traffic light mean?",
      options: ["Go", "Stop", "Slow down", "Caution"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What should you do when you see a pedestrian crossing?",
      options: ["Speed up", "Stop and let them cross", "Honk loudly", "Ignore them"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What is the speed limit in residential areas?",
      options: ["30 km/h", "50 km/h", "70 km/h", "100 km/h"],
      correct: 0,
      difficulty: "medium"
    },
    {
      question: "When should you use indicators while driving?",
      options: ["Only at night", "When changing lanes or turning", "Only in traffic", "Never"],
      correct: 1,
      difficulty: "easy"
    }
  ],
  cooking: [
    {
      question: "At what temperature should chicken be cooked to ensure it's safe to eat?",
      options: ["60°C", "75°C", "85°C", "100°C"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What is the first step in food preparation?",
      options: ["Cutting vegetables", "Washing hands", "Heating oil", "Adding spices"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "Which knife is best for chopping vegetables?",
      options: ["Paring knife", "Chef's knife", "Bread knife", "Steak knife"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What does 'sauté' mean in cooking?",
      options: ["Deep fry", "Boil", "Cook quickly in a little fat", "Steam"],
      correct: 2,
      difficulty: "medium"
    },
    {
      question: "How long can cooked food be safely left at room temperature?",
      options: ["1 hour", "2 hours", "4 hours", "6 hours"],
      correct: 1,
      difficulty: "hard"
    }
  ],
  mechanic: [
    {
      question: "What tool is used to remove and install nuts and bolts?",
      options: ["Screwdriver", "Wrench", "Hammer", "Pliers"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What should you check first when a vehicle won't start?",
      options: ["Engine oil", "Battery", "Tires", "Brakes"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "How often should engine oil be changed?",
      options: ["Every 1000 km", "Every 5000 km", "Every 10000 km", "Every 20000 km"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What does ABS stand for in vehicles?",
      options: ["Auto Brake System", "Anti-lock Braking System", "Advanced Brake Support", "Automatic Brake Safety"],
      correct: 1,
      difficulty: "hard"
    },
    {
      question: "Which fluid is used in hydraulic brake systems?",
      options: ["Engine oil", "Brake fluid", "Coolant", "Transmission fluid"],
      correct: 1,
      difficulty: "medium"
    }
  ],
  waiter: [
    {
      question: "What should you do first when a customer arrives?",
      options: ["Take their order", "Greet them warmly", "Bring water", "Show them the menu"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "How should you carry multiple plates?",
      options: ["One in each hand", "Stack them high", "Use proper carrying technique", "Ask for help always"],
      correct: 2,
      difficulty: "medium"
    },
    {
      question: "What should you do if a customer complains about their food?",
      options: ["Ignore them", "Argue with them", "Listen and offer a solution", "Call the manager immediately"],
      correct: 2,
      difficulty: "medium"
    },
    {
      question: "When should you refill water glasses?",
      options: ["Only when asked", "When they're half empty", "At the end of the meal", "Never"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What is the proper way to present a bill?",
      options: ["Throw it on the table", "Hand it directly to the customer", "Place it discretely on the table", "Email it to them"],
      correct: 2,
      difficulty: "medium"
    }
  ],
  vehicle_cleaning: [
    {
      question: "What should you use to clean car windows?",
      options: ["Newspaper", "Glass cleaner and microfiber cloth", "Soap and water", "Paper towels"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "In what order should you wash a car?",
      options: ["Bottom to top", "Top to bottom", "Random order", "Inside first"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What type of soap should be used for car washing?",
      options: ["Dish soap", "Laundry detergent", "Car-specific soap", "Hand soap"],
      correct: 2,
      difficulty: "medium"
    },
    {
      question: "How often should car interiors be vacuumed?",
      options: ["Daily", "Weekly", "Monthly", "Yearly"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What should you avoid when cleaning leather seats?",
      options: ["Water", "Harsh chemicals", "Soft cloth", "Leather conditioner"],
      correct: 1,
      difficulty: "medium"
    }
  ],
  cleaning: [
    {
      question: "What is the most important safety rule when using cleaning chemicals?",
      options: ["Work fast", "Read labels and follow instructions", "Use as much as possible", "Mix different chemicals"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "Which direction should you mop a floor?",
      options: ["In circles", "Back and forth randomly", "From far end toward exit", "From entrance inward"],
      correct: 2,
      difficulty: "medium"
    },
    {
      question: "What should you do before vacuuming?",
      options: ["Nothing", "Pick up large debris", "Spray air freshener", "Open all windows"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "How should you clean mirrors without streaking?",
      options: ["Use newspaper", "Use microfiber cloth in circular motions", "Use paper towels", "Use a squeegee"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What is the proper way to sanitize surfaces?",
      options: ["Spray and wipe immediately", "Spray and let sit for contact time", "Use hot water only", "Wipe with dry cloth"],
      correct: 1,
      difficulty: "hard"
    }
  ],
  bartending: [
    {
      question: "What is the standard measure for a shot of alcohol?",
      options: ["15ml", "30ml", "45ml", "60ml"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What should you check before serving alcohol to a customer?",
      options: ["Their mood", "Their age/ID", "Their clothes", "Their accent"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What is the proper way to shake a cocktail?",
      options: ["Gently", "Vigorously for 10-15 seconds", "For 1 minute", "Don't shake, just stir"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "When should you refuse service to a customer?",
      options: ["Never", "When they're intoxicated", "When they're rude", "When they don't tip"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What is the difference between 'neat' and 'on the rocks'?",
      options: ["No difference", "Neat is with ice, rocks is without", "Neat is without ice, rocks is with ice", "Both are the same"],
      correct: 2,
      difficulty: "hard"
    }
  ],
  dishwashing: [
    {
      question: "What is the correct water temperature for washing dishes?",
      options: ["Cold water", "Lukewarm water", "Hot water (60-70°C)", "Boiling water"],
      correct: 2,
      difficulty: "medium"
    },
    {
      question: "In what order should you wash dishes?",
      options: ["Pots first", "Glasses first", "Plates first", "Random order"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "How should you sanitize dishes after washing?",
      options: ["Air dry only", "Rinse with hot water", "Use sanitizing solution", "Wipe with towel"],
      correct: 2,
      difficulty: "hard"
    },
    {
      question: "What should you do with heavily soiled pots?",
      options: ["Wash immediately", "Soak first", "Use cold water", "Ignore them"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "How should you handle broken dishes?",
      options: ["Pick up with hands", "Use a broom and dustpan", "Leave for someone else", "Kick under counter"],
      correct: 1,
      difficulty: "easy"
    }
  ],
  laundry: [
    {
      question: "What should you check before washing clothes?",
      options: ["Color", "Fabric care labels", "Size", "Brand"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What temperature water should be used for white clothes?",
      options: ["Cold", "Warm", "Hot", "Any temperature"],
      correct: 2,
      difficulty: "medium"
    },
    {
      question: "How should you separate laundry?",
      options: ["By size", "By color and fabric type", "By owner", "Don't separate"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What should you do if you find a stain?",
      options: ["Ignore it", "Treat it before washing", "Wash in hot water", "Throw the item away"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "How much detergent should you use?",
      options: ["As much as possible", "According to package instructions", "Very little", "Half the bottle"],
      correct: 1,
      difficulty: "easy"
    }
  ],
  gardening: [
    {
      question: "When is the best time to water plants?",
      options: ["Noon", "Early morning or evening", "Midnight", "Anytime"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What do plants need to grow?",
      options: ["Only water", "Only sunlight", "Water, sunlight, and nutrients", "Only soil"],
      correct: 2,
      difficulty: "easy"
    },
    {
      question: "How deep should you plant seeds?",
      options: ["Very deep", "2-3 times the seed diameter", "Just on surface", "1 foot deep"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What is composting?",
      options: ["Burning leaves", "Decomposing organic matter for fertilizer", "Planting seeds", "Watering plants"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "How can you tell if a plant needs water?",
      options: ["Check soil moisture", "Look at the calendar", "Guess", "Water daily regardless"],
      correct: 0,
      difficulty: "easy"
    }
  ],
  plumbing: [
    {
      question: "What tool is essential for most plumbing jobs?",
      options: ["Hammer", "Pipe wrench", "Screwdriver", "Saw"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What should you do before starting any plumbing work?",
      options: ["Call a friend", "Turn off the water supply", "Buy new tools", "Check the weather"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What causes most toilet clogs?",
      options: ["Too much water", "Foreign objects", "Old pipes", "Bad installation"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "How do you fix a dripping faucet?",
      options: ["Hit it with hammer", "Replace washers or O-rings", "Use more force", "Ignore it"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What is the purpose of a P-trap?",
      options: ["Decoration", "Prevent sewer gases from entering", "Increase water pressure", "Store water"],
      correct: 1,
      difficulty: "hard"
    }
  ],
  carpentering: [
    {
      question: "What is the most versatile saw for a carpenter?",
      options: ["Hacksaw", "Circular saw", "Jigsaw", "Hand saw"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What should you always wear when using power tools?",
      options: ["Gloves only", "Safety glasses", "Loose clothing", "Nothing special"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What is the purpose of sandpaper?",
      options: ["Cutting wood", "Smoothing surfaces", "Measuring", "Joining pieces"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "How should you measure twice, cut once?",
      options: ["Measure carefully before cutting", "Cut twice", "Use two rulers", "Guess the measurement"],
      correct: 0,
      difficulty: "medium"
    },
    {
      question: "What type of joint is strongest for corners?",
      options: ["Butt joint", "Dovetail joint", "Lap joint", "Miter joint"],
      correct: 1,
      difficulty: "hard"
    }
  ],
  painting: [
    {
      question: "What should you do before painting a wall?",
      options: ["Start painting immediately", "Clean and prepare the surface", "Buy expensive brushes", "Paint in the dark"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What type of brush is best for smooth surfaces?",
      options: ["Natural bristle", "Synthetic bristle", "Foam brush", "Any brush"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "How many coats of paint are usually needed?",
      options: ["1", "2-3", "5", "10"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What is primer used for?",
      options: ["Final coat", "Preparing surface for paint", "Cleaning brushes", "Mixing colors"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "How should you clean oil-based paint brushes?",
      options: ["Water", "Soap and water", "Paint thinner", "Leave them dirty"],
      correct: 2,
      difficulty: "medium"
    }
  ],
  electric_work: [
    {
      question: "What is the first rule of electrical safety?",
      options: ["Work fast", "Turn off power at breaker", "Use metal tools", "Work in water"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What does a circuit breaker do?",
      options: ["Increases power", "Protects from electrical overload", "Changes voltage", "Stores electricity"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What tool is used to test if wires are live?",
      options: ["Hammer", "Voltage tester", "Screwdriver", "Pliers"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What color wire is typically used for ground?",
      options: ["Red", "Black", "Green", "Blue"],
      correct: 2,
      difficulty: "medium"
    },
    {
      question: "What should you never do with electrical equipment?",
      options: ["Turn it off", "Work on it while energized", "Use proper tools", "Follow safety procedures"],
      correct: 1,
      difficulty: "easy"
    }
  ],
  electronic_repair: [
    {
      question: "What tool is essential for electronic repair?",
      options: ["Hammer", "Multimeter", "Saw", "Paintbrush"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What should you do before opening an electronic device?",
      options: ["Nothing", "Disconnect power and remove battery", "Hit it", "Spray with water"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What can damage electronic components?",
      options: ["Static electricity", "Proper tools", "Clean workspace", "Good lighting"],
      correct: 0,
      difficulty: "medium"
    },
    {
      question: "What is the purpose of a heat sink?",
      options: ["Decoration", "Dissipate heat", "Increase power", "Store data"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "How should you handle circuit boards?",
      options: ["Roughly", "By the edges carefully", "With wet hands", "With metal tools"],
      correct: 1,
      difficulty: "medium"
    }
  ],
  security_guards: [
    {
      question: "What is the primary duty of a security guard?",
      options: ["Sleep", "Observe and report", "Fight criminals", "Ignore everything"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What should you do if you see suspicious activity?",
      options: ["Ignore it", "Report it immediately", "Handle it yourself", "Take a photo only"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "How should you patrol an area?",
      options: ["Same route every time", "Vary routes and timing", "Very quickly", "Only during day"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What information should be in an incident report?",
      options: ["Only time", "Who, what, when, where, how", "Just your opinion", "Nothing"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "When should you call police?",
      options: ["Never", "For serious crimes or emergencies", "For everything", "Only if asked"],
      correct: 1,
      difficulty: "easy"
    }
  ],
  warehouse_works: [
    {
      question: "What is the most important safety rule in a warehouse?",
      options: ["Work fast", "Lift with your back", "Follow safety procedures", "Ignore safety gear"],
      correct: 2,
      difficulty: "easy"
    },
    {
      question: "How should you lift heavy objects?",
      options: ["With your back", "With your legs", "Very quickly", "Alone always"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What does FIFO mean in warehouse management?",
      options: ["Fast In, Fast Out", "First In, First Out", "Find It, Fix it, Organize", "Final Inventory For Orders"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "What should you wear in a warehouse?",
      options: ["Sandals", "Safety shoes and protective gear", "Loose clothing", "Nothing special"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "How should items be stored on high shelves?",
      options: ["Heaviest items on top", "Lightest items on top", "Random placement", "Don't use high shelves"],
      correct: 1,
      difficulty: "medium"
    }
  ],
  constructor_labour: [
    {
      question: "What is the most important thing on a construction site?",
      options: ["Speed", "Safety", "Appearance", "Cost"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What should you always wear on a construction site?",
      options: ["Casual clothes", "Hard hat and safety gear", "Expensive clothes", "Nothing special"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "How should you handle power tools?",
      options: ["Carelessly", "According to safety instructions", "Very fast", "Without training"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "What should you do if you see unsafe conditions?",
      options: ["Ignore them", "Report them immediately", "Fix them yourself", "Work around them"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "How should materials be stored on site?",
      options: ["Anywhere", "Organized and secure", "In walkways", "Unsecured"],
      correct: 1,
      difficulty: "medium"
    }
  ]
};

// Function to generate variations of questions
function generateQuestionVariations(baseQuestions, targetCount = 200) {
  const variations = [];
  const difficultyLevels = ['easy', 'medium', 'hard'];
  
  // First, add all base questions
  baseQuestions.forEach(q => {
    variations.push({
      question: q.question,
      options: q.options.map((opt, idx) => ({
        text: opt,
        is_correct: idx === q.correct
      })),
      difficulty_level: q.difficulty || 'medium'
    });
  });
  
  // Generate variations to reach target count
  while (variations.length < targetCount) {
    const baseQuestion = baseQuestions[Math.floor(Math.random() * baseQuestions.length)];
    const difficulty = difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)];
    
    // Create slight variations
    const questionVariations = [
      baseQuestion.question,
      baseQuestion.question.replace('What', 'Which'),
      baseQuestion.question.replace('How', 'What is the best way to'),
      baseQuestion.question.replace('should', 'must'),
      baseQuestion.question.replace('?', ' in professional settings?')
    ];
    
    const selectedVariation = questionVariations[Math.floor(Math.random() * questionVariations.length)];
    
    variations.push({
      question: selectedVariation,
      options: baseQuestion.options.map((opt, idx) => ({
        text: opt,
        is_correct: idx === baseQuestion.correct
      })),
      difficulty_level: difficulty
    });
  }
  
  return variations.slice(0, targetCount);
}

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sahayak', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Main function to populate question bank
async function populateQuestionBank() {
  try {
    await connectDB();
    
    console.log('🚀 Starting question bank population...\n');
    
    // First, ensure all skills exist
    console.log('1. Creating/updating skills...');
    for (const skillData of skillsData) {
      await Skill.findOneAndUpdate(
        { name: skillData.name },
        skillData,
        { upsert: true, new: true }
      );
      console.log(`   ✅ Skill: ${skillData.name}`);
    }
    
    console.log('\n2. Generating questions for each skill...');
    
    for (const skillData of skillsData) {
      const skill = await Skill.findOne({ name: skillData.name });
      if (!skill) {
        console.log(`   ❌ Skill not found: ${skillData.name}`);
        continue;
      }
      
      // Check if questions already exist
      const existingCount = await AssessmentQuestion.countDocuments({ skill_id: skill._id });
      if (existingCount >= 200) {
        console.log(`   ⏭️  Skill ${skillData.name} already has ${existingCount} questions, skipping...`);
        continue;
      }
      
      // Generate questions
      const baseQuestions = questionTemplates[skillData.name] || questionTemplates.waiter; // fallback
      const questions = generateQuestionVariations(baseQuestions, 200);
      
      // Add skill_id and category to each question
      const questionsToInsert = questions.map(q => ({
        ...q,
        skill_id: skill._id,
        category: skillData.category ? skillData.category[Math.floor(Math.random() * skillData.category.length)] : undefined
      }));
      
      // Remove existing questions for this skill
      await AssessmentQuestion.deleteMany({ skill_id: skill._id });
      
      // Insert new questions
      await AssessmentQuestion.insertMany(questionsToInsert);
      
      console.log(`   ✅ Generated 200 questions for ${skillData.name}`);
    }
    
    console.log('\n🎉 Question bank population completed!');
    
    // Summary
    const totalQuestions = await AssessmentQuestion.countDocuments();
    const totalSkills = await Skill.countDocuments();
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Skills: ${totalSkills}`);
    console.log(`   Total Questions: ${totalQuestions}`);
    console.log(`   Average Questions per Skill: ${Math.round(totalQuestions / totalSkills)}`);
    
  } catch (error) {
    console.error('❌ Error populating question bank:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  populateQuestionBank();
}

module.exports = { populateQuestionBank, skillsData, questionTemplates };