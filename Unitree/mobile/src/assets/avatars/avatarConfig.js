// Avatar configuration for predefined avatars
// Each avatar has an id, name, description, and colors for fallback display

export const AVATAR_CATEGORIES = {
  ANIMALS: 'animals',
  NATURE: 'nature', 
  ABSTRACT: 'abstract',
  CHARACTERS: 'characters'
};

export const PREDEFINED_AVATARS = [
  // Animals Category
  {
    id: 'fox',
    name: 'Fox',
    category: AVATAR_CATEGORIES.ANIMALS,
    colors: ['#FF6B35', '#F7931E'],
    emoji: '🦊',
    description: 'Clever and adaptable'
  },
  {
    id: 'owl',
    name: 'Owl',
    category: AVATAR_CATEGORIES.ANIMALS,
    colors: ['#8B4513', '#DEB887'],
    emoji: '🦉',
    description: 'Wise and observant'
  },
  {
    id: 'panda',
    name: 'Panda',
    category: AVATAR_CATEGORIES.ANIMALS,
    colors: ['#000000', '#FFFFFF'],
    emoji: '🐼',
    description: 'Peaceful and gentle'
  },
  {
    id: 'lion',
    name: 'Lion',
    category: AVATAR_CATEGORIES.ANIMALS,
    colors: ['#DAA520', '#FFA500'],
    emoji: '🦁',
    description: 'Bold and confident'
  },
  {
    id: 'elephant',
    name: 'Elephant',
    category: AVATAR_CATEGORIES.ANIMALS,
    colors: ['#696969', '#A9A9A9'],
    emoji: '🐘',
    description: 'Strong and reliable'
  },
  {
    id: 'penguin',
    name: 'Penguin',
    category: AVATAR_CATEGORIES.ANIMALS,
    colors: ['#000000', '#FFFFFF'],
    emoji: '🐧',
    description: 'Social and loyal'
  },

  // Nature Category
  {
    id: 'tree',
    name: 'Tree',
    category: AVATAR_CATEGORIES.NATURE,
    colors: ['#228B22', '#8FBC8F'],
    emoji: '🌳',
    description: 'Grounded and growing'
  },
  {
    id: 'flower',
    name: 'Flower',
    category: AVATAR_CATEGORIES.NATURE,
    colors: ['#FF69B4', '#FFB6C1'],
    emoji: '🌸',
    description: 'Beautiful and nurturing'
  },
  {
    id: 'mountain',
    name: 'Mountain',
    category: AVATAR_CATEGORIES.NATURE,
    colors: ['#8B7355', '#D2B48C'],
    emoji: '⛰️',
    description: 'Steady and ambitious'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    category: AVATAR_CATEGORIES.NATURE,
    colors: ['#4682B4', '#87CEEB'],
    emoji: '🌊',
    description: 'Deep and mysterious'
  },
  {
    id: 'sun',
    name: 'Sun',
    category: AVATAR_CATEGORIES.NATURE,
    colors: ['#FFD700', '#FFA500'],
    emoji: '☀️',
    description: 'Bright and energetic'
  },
  {
    id: 'moon',
    name: 'Moon',
    category: AVATAR_CATEGORIES.NATURE,
    colors: ['#C0C0C0', '#F5F5DC'],
    emoji: '🌙',
    description: 'Calm and reflective'
  },

  // Abstract Category
  {
    id: 'geometric_blue',
    name: 'Blue Geometry',
    category: AVATAR_CATEGORIES.ABSTRACT,
    colors: ['#4169E1', '#87CEFA'],
    emoji: '🔷',
    description: 'Modern and structured'
  },
  {
    id: 'geometric_purple',
    name: 'Purple Geometry',
    category: AVATAR_CATEGORIES.ABSTRACT,
    colors: ['#8A2BE2', '#DDA0DD'],
    emoji: '🔮',
    description: 'Creative and intuitive'
  },
  {
    id: 'geometric_green',
    name: 'Green Geometry',
    category: AVATAR_CATEGORIES.ABSTRACT,
    colors: ['#32CD32', '#98FB98'],
    emoji: '💚',
    description: 'Fresh and innovative'
  },
  {
    id: 'geometric_orange',
    name: 'Orange Geometry',
    category: AVATAR_CATEGORIES.ABSTRACT,
    colors: ['#FF4500', '#FFA07A'],
    emoji: '🧡',
    description: 'Warm and enthusiastic'
  },

  // Characters Category
  {
    id: 'robot',
    name: 'Robot',
    category: AVATAR_CATEGORIES.CHARACTERS,
    colors: ['#708090', '#C0C0C0'],
    emoji: '🤖',
    description: 'Tech-savvy and logical'
  },
  {
    id: 'astronaut',
    name: 'Astronaut',
    category: AVATAR_CATEGORIES.CHARACTERS,
    colors: ['#FFFFFF', '#4169E1'],
    emoji: '👨‍🚀',
    description: 'Explorer and dreamer'
  },
  {
    id: 'artist',
    name: 'Artist',
    category: AVATAR_CATEGORIES.CHARACTERS,
    colors: ['#FF1493', '#FFB6C1'],
    emoji: '🎨',
    description: 'Creative and expressive'
  },
  {
    id: 'scientist',
    name: 'Scientist',
    category: AVATAR_CATEGORIES.CHARACTERS,
    colors: ['#00CED1', '#E0FFFF'],
    emoji: '🔬',
    description: 'Curious and analytical'
  }
];

// Function to get avatar by ID
export const getAvatarById = (id) => {
  return PREDEFINED_AVATARS.find(avatar => avatar.id === id);
};

// Function to get avatars by category
export const getAvatarsByCategory = (category) => {
  return PREDEFINED_AVATARS.filter(avatar => avatar.category === category);
};

// Function to generate gradient background from avatar colors
export const getAvatarGradient = (avatar) => {
  if (!avatar || !avatar.colors || avatar.colors.length < 2) {
    return ['#50AF27', '#98D56D']; // Default green gradient
  }
  return avatar.colors;
};

// Default avatar for new users
export const DEFAULT_AVATAR = PREDEFINED_AVATARS[0]; // Fox 