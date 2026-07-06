const Trip = require('../models/Trip');
const AiLog = require('../models/AiLog');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');

// In-memory caches for Nominatim and Open-Meteo API requests
const coordsCache = new Map();
const weatherCache = new Map();

// OpenAPI 3.0 Schemas for Gemini Structured JSON output
const tripSchema = {
  type: "object",
  properties: {
    itinerary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          date: { type: "string" },
          schedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time: { type: "string" },
                activity: { type: "string" },
                description: { type: "string" },
                location: { type: "string" },
                cost: { type: "integer" }
              },
              required: ["time", "activity", "description", "location", "cost"]
            }
          }
        },
        required: ["day", "date", "schedule"]
      }
    },
    recommendedHotels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          hotelName: { type: "string" },
          rating: { type: "number" },
          estimatedCost: { type: "integer" },
          location: { type: "string" },
          reasonForRecommendation: { type: "string" }
        },
        required: ["hotelName", "rating", "estimatedCost", "location", "reasonForRecommendation"]
      }
    },
    recommendedRestaurants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          restaurantName: { type: "string" },
          cuisine: { type: "string" },
          estimatedCost: { type: "integer" },
          specialty: { type: "string" }
        },
        required: ["restaurantName", "cuisine", "estimatedCost", "specialty"]
      }
    },
    attractions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          placeName: { type: "string" },
          category: { type: "string" },
          bestTimeToVisit: { type: "string" },
          estimatedDuration: { type: "string" },
          entryFee: { type: "integer" },
          distanceFromDestination: { type: "string" }
        },
        required: ["placeName", "category", "bestTimeToVisit", "estimatedDuration"]
      }
    },
    budgetBreakdown: {
      type: "object",
      properties: {
        accommodationBudget: { type: "integer" },
        foodBudget: { type: "integer" },
        transportationBudget: { type: "integer" },
        activityBudget: { type: "integer" },
        emergencyBudget: { type: "integer" }
      },
      required: ["accommodationBudget", "foodBudget", "transportationBudget", "activityBudget", "emergencyBudget"]
    },
    weatherInfo: {
      type: "object",
      properties: {
        forecast: { type: "string" },
        warnings: { type: "string" },
        recommendations: { type: "string" }
      },
      required: ["forecast", "warnings", "recommendations"]
    },
    sentimentAnalysis: {
      type: "object",
      properties: {
        averageHotelRating: { type: "number" },
        overallSentiment: { type: "string" }
      },
      required: ["averageHotelRating", "overallSentiment"]
    },
    riskAnalysis: {
      type: "object",
      properties: {
        riskLevel: { type: "string" },
        reason: { type: "string" },
        recommendation: { type: "string" }
      },
      required: ["riskLevel", "reason", "recommendation"]
    }
  },
  required: [
    "itinerary",
    "recommendedHotels",
    "recommendedRestaurants",
    "attractions",
    "budgetBreakdown",
    "weatherInfo",
    "sentimentAnalysis",
    "riskAnalysis"
  ]
};

const attractionsSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      type: { type: "string" },
      description: { type: "string" },
      rating: { type: "number" },
      imageSearchQuery: { type: "string" },
      highlights: {
        type: "array",
        items: { type: "string" }
      },
      bestTime: { type: "string" },
      fee: { type: "string" }
    },
    required: ["name", "type", "description", "rating", "imageSearchQuery", "highlights", "bestTime", "fee"]
  }
};

const hotelsSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      type: { type: "string" },
      description: { type: "string" },
      rating: { type: "number" },
      imageSearchQuery: { type: "string" },
      priceRange: { type: "string" },
      amenities: {
        type: "array",
        items: { type: "string" }
      },
      locationSummary: { type: "string" }
    },
    required: ["name", "type", "description", "rating", "imageSearchQuery", "priceRange", "amenities", "locationSummary"]
  }
};

const foodSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      type: { type: "string" },
      description: { type: "string" },
      rating: { type: "number" },
      imageSearchQuery: { type: "string" },
      priceRange: { type: "string" },
      recommendedPlaces: {
        type: "array",
        items: { type: "string" }
      },
      keyIngredients: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["name", "type", "description", "rating", "imageSearchQuery", "priceRange", "recommendedPlaces", "keyIngredients"]
  }
};

const itinerarySchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    overview: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          theme: { type: "string" },
          activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time: { type: "string" },
                name: { type: "string" },
                description: { type: "string" }
              },
              required: ["time", "name", "description"]
            }
          }
        },
        required: ["day", "theme", "activities"]
      }
    }
  },
  required: ["title", "overview", "days"]
};

const sentimentSchema = {
  type: "object",
  properties: {
    label: { type: "string", enum: ["Positive", "Neutral", "Negative"] },
    score: { type: "number" },
    keywords: {
      type: "array",
      items: { type: "string" }
    },
    confidence: { type: "number" }
  },
  required: ["label", "score", "keywords", "confidence"]
};

/**
 * Audit log helper to write AI call request and response logs.
 */
async function logAiCall({ userId, endpoint, requestPayload, responsePayload, status, error }) {
  try {
    await AiLog.create({
      userId,
      endpoint,
      requestPayload,
      responsePayload,
      status,
      error
    });
  } catch (err) {
    console.error('Failed to save AI audit log:', err);
  }
}

/**
 * Helper to fetch coordinates from OpenStreetMap Nominatim API.
 */
async function getCoordinates(destination) {
  const cacheKey = destination.toLowerCase().trim();
  if (coordsCache.has(cacheKey)) {
    console.log(`[Cache Hit] Location coordinates resolved from cache: ${destination}`);
    return coordsCache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'SmartTripPlanner/1.0 (contact@smarttripplanner.com)'
        }
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
      coordsCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error('Error fetching coordinates:', err);
  }
  // Default fallback (e.g. Paris center)
  const fallback = { lat: 48.8566, lon: 2.3522, displayName: destination };
  coordsCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Helper to fetch weather forecast from Open-Meteo API.
 */
async function getWeatherForecast(lat, lon, startDate, endDate) {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)},${startDate},${endDate}`;
  if (weatherCache.has(cacheKey)) {
    console.log(`[Cache Hit] Weather forecast resolved from cache: ${cacheKey}`);
    return weatherCache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
    );
    const data = await response.json();
    if (data && data.daily) {
      const daily = data.daily;
      let summary = [];
      let rainDays = [];
      let tempMaxSum = 0;
      let tempMinSum = 0;
      
      const count = daily.time.length;
      for (let i = 0; i < count; i++) {
        const dateStr = daily.time[i];
        const tempMax = daily.temperature_2m_max[i];
        const tempMin = daily.temperature_2m_min[i];
        const prec = daily.precipitation_sum[i];
        
        tempMaxSum += tempMax;
        tempMinSum += tempMin;
        
        if (prec > 2.0) {
          rainDays.push(dateStr);
        }
      }
      
      const avgMax = (tempMaxSum / count).toFixed(1);
      const avgMin = (tempMinSum / count).toFixed(1);
      
      let forecastSummary = `Average temperature: ${avgMin}°C to ${avgMax}°C. `;
      let warningSummary = 'None';
      let recommendationSummary = 'Weather seems pleasant. Standard travel gear is recommended.';
      
      if (rainDays.length > 0) {
        forecastSummary += `Rain expected on ${rainDays.length} days.`;
        warningSummary = `Rain predicted during the trip dates. Heavy rain possible.`;
        recommendationSummary = `Carry umbrellas/raincoats. Arrange indoor activities (museums, shopping, cafes) on rainy days.`;
      }
      
      const result = {
        forecast: forecastSummary,
        warnings: warningSummary,
        recommendations: recommendationSummary,
        rawDaily: daily
      };
      weatherCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error('Error fetching weather:', err);
  }

  const fallback = {
    forecast: 'Standard weather forecast (22°C - 28°C, sunny)',
    warnings: 'No severe weather warnings active.',
    recommendations: 'Wear light clothing. Carry sunglasses and sunscreen.'
  };
  weatherCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Generate a mock response matching the required schema if no OpenAI API Key is provided.
 */
function generateMockTripResponse(params, weather) {
  const { destination, budget, startDate, endDate, travelers, tripType, interests, accommodationPreference, foodPreference } = params;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

  // Divide budget
  const budgetVal = Number(budget);
  const budgetBreakdown = {
    accommodationBudget: Math.round(budgetVal * 0.4),
    foodBudget: Math.round(budgetVal * 0.25),
    transportationBudget: Math.round(budgetVal * 0.15),
    activityBudget: Math.round(budgetVal * 0.12),
    emergencyBudget: Math.round(budgetVal * 0.08)
  };

  // Generate Day-wise Itinerary
  const itinerary = [];
  const scheduleTemplates = [
    [
      { time: "08:00 AM", activity: "Arrival & Welcome", description: `Arrive in ${destination}. Transfer to hotel.` },
      { time: "09:00 AM", activity: "Hotel Check-In", description: `Check-in and unpack at your chosen accommodation.` },
      { time: "11:00 AM", activity: "Local City Walking Tour", description: `Explore the historical streets and core landmarks.` },
      { time: "01:00 PM", activity: "Lunch", description: `Enjoy fresh ${foodPreference} meal at a local cafe.` },
      { time: "03:00 PM", activity: "Museum/Gallery Visit", description: `Learn about local history, culture and art.` },
      { time: "07:00 PM", activity: "Dinner", description: `Fine dining to wrap up the first day.` },
      { time: "09:00 PM", activity: "Return to Hotel", description: `Rest up for the adventure tomorrow.` }
    ],
    [
      { time: "08:30 AM", activity: "Outdoor Adventure / Sightseeing", description: "Venture to a popular scenic point or natural landmark." },
      { time: "12:30 PM", activity: "Picnic Lunch", description: "A casual outdoors meal with spectacular views." },
      { time: "02:30 PM", activity: "Shopping and Local Markets", description: "Hunt for souvenirs and handcrafted goods." },
      { time: "07:30 PM", activity: "Dinner & Nightlife", description: "Experience the vibrant food scene and night market." }
    ]
  ];

  for (let i = 1; i <= days; i++) {
    const curDate = new Date(start);
    curDate.setDate(start.getDate() + (i - 1));
    const dateStr = curDate.toISOString().split('T')[0];

    // If rain warning, substitute outdoor with indoor activity
    let schedule = JSON.parse(JSON.stringify(scheduleTemplates[(i - 1) % scheduleTemplates.length]));
    if (weather.warnings !== 'None' && i === 2) {
      schedule = schedule.map(item => {
        if (item.activity.includes("Outdoor") || item.activity.includes("Adventure")) {
          return {
            ...item,
            activity: "Indoor Cultural Center & Art Museum Visit",
            description: "Rainy day substitution: Explore the interactive exhibits and planetarium indoors."
          };
        }
        return item;
      });
    }

    itinerary.push({
      day: i,
      date: dateStr,
      schedule
    });
  }

  // Hotels recommendations
  const recommendedHotels = [
    {
      hotelName: `${destination} Grand Plaza`,
      rating: 4.8,
      estimatedCost: Math.round(budgetBreakdown.accommodationBudget / days * 0.9),
      location: `Downtown ${destination}`,
      reasonForRecommendation: `Close to transport. Excellent premium service aligned with your ${accommodationPreference} preference.`,
      sentiment: { positivePercentage: 88, neutralPercentage: 8, negativePercentage: 4, recommendationScore: 8.8 }
    },
    {
      hotelName: `${destination} Cozy Homestay`,
      rating: 4.5,
      estimatedCost: Math.round(budgetBreakdown.accommodationBudget / days * 0.5),
      location: `Quiet neighborhood, ${destination}`,
      reasonForRecommendation: `Highly reviewed host. Aligned with budget-conscious and authentic local experience.`,
      sentiment: { positivePercentage: 92, neutralPercentage: 6, negativePercentage: 2, recommendationScore: 9.2 }
    }
  ];

  // Restaurants recommendations
  const recommendedRestaurants = [
    {
      restaurantName: `The Local Kitchen`,
      cuisine: foodPreference === 'Vegetarian' ? 'Vegetarian Indian' : 'Traditional Fusion',
      estimatedCost: Math.round(budgetBreakdown.foodBudget / days / 3),
      specialty: `Chef's Special Thali / Signature Platter`,
      sentiment: { positivePercentage: 90, neutralPercentage: 7, negativePercentage: 3, recommendationScore: 9.0 }
    },
    {
      restaurantName: `Bistro 24`,
      cuisine: 'Continental & Local Cafes',
      estimatedCost: Math.round(budgetBreakdown.foodBudget / days / 4),
      specialty: 'House Brewed Coffee and Fresh Pastries',
      sentiment: { positivePercentage: 84, neutralPercentage: 12, negativePercentage: 4, recommendationScore: 8.4 }
    }
  ];

  // Attractions recommendations
  const attractions = [
    {
      placeName: `${destination} Landmark Sanctuary`,
      category: 'Nature & Heritage',
      bestTimeToVisit: 'Morning 9 AM',
      estimatedDuration: '3 hours',
      entryFee: 150,
      distanceFromDestination: '3 km'
    },
    {
      placeName: `${destination} Central Heritage Museum`,
      category: 'Historical',
      bestTimeToVisit: 'Afternoon 2 PM',
      estimatedDuration: '2 hours',
      entryFee: 250,
      distanceFromDestination: '1.5 km'
    }
  ];

  // Risk Analysis
  let riskLevel = 'Low';
  let riskReason = 'No major risks identified. Budget allocation fits standard itineraries.';
  let riskRec = 'Make sure to carry copy of ID and keep emergency cash handy.';

  if (budgetVal < 10000) {
    riskLevel = 'Moderate';
    riskReason = 'Low budget allocated for a multi-day trip. Extreme caution is needed to avoid overspending.';
    riskRec = 'Use public transport, prefer free monuments, and stay in budget shared hostels.';
  }
  if (weather.warnings !== 'None') {
    riskLevel = 'Moderate';
    riskReason = 'Rain is forecast during the travel window, risking outdoor delays.';
    riskRec = 'Ensure indoor alternatives are scheduled, pack rainwear, and purchase travel insurance.';
  }

  return {
    itinerary,
    recommendedHotels,
    recommendedRestaurants,
    attractions,
    budgetBreakdown,
    weatherInfo: {
      forecast: weather.forecast,
      warnings: weather.warnings,
      recommendations: weather.recommendations
    },
    sentimentAnalysis: {
      averageHotelRating: 4.65,
      overallSentiment: 'Positive'
    },
    riskAnalysis: {
      riskLevel,
      reason: riskReason,
      recommendation: riskRec
    }
  };
}

/**
 * Call Gemini API using generateContent.
 */
async function callGemini(systemPrompt, userPrompt, responseSchema = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in env');
  }

  let configuredModelName = 'gemini-flash-latest'; // default
  try {
    const modelSetting = await Setting.findOne({ key: 'GEMINI_MODEL' });
    if (modelSetting && modelSetting.value) {
      configuredModelName = modelSetting.value;
    }
  } catch (err) {
    console.error('Error fetching GEMINI_MODEL setting, using fallback model:', err);
  }

  // Clean primary model name
  const cleanModelName = configuredModelName.startsWith('models/') ? configuredModelName.substring(7) : configuredModelName;

  // Build the fallback chain of models
  const modelChain = [cleanModelName];
  const defaults = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const m of defaults) {
    if (!modelChain.includes(m)) {
      modelChain.push(m);
    }
  }

  let lastError = null;

  for (let mIndex = 0; mIndex < modelChain.length; mIndex++) {
    const modelName = modelChain[mIndex];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        ...(responseSchema && { responseSchema })
      }
    };

    const maxRetries = 3;
    let delay = 1000;
    let success = false;
    let result = null;

    console.log(`[Gemini Request] Routing to model: ${modelName}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errText = await response.text();
          let errorMessage = `Gemini API error: ${response.status} - ${errText}`;
          try {
            const parsedError = JSON.parse(errText);
            if (parsedError.error && parsedError.error.message) {
              errorMessage = `Gemini API error (${response.status}): ${parsedError.error.message}`;
            }
          } catch (parseErr) {
            // Keep original message if parsing fails
          }

          // Check if this error is transient
          const isTransient = response.status === 503 || response.status === 429;
          if (isTransient && attempt < maxRetries) {
            console.warn(`[Transient Error ${response.status}] Attempt ${attempt} failed for model ${modelName}. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }

          throw new Error(errorMessage);
        }

        const jsonResult = await response.json();
        if (!jsonResult.candidates || !jsonResult.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('Gemini API returned no text output');
        }

        const text = jsonResult.candidates[0].content.parts[0].text;
        result = JSON.parse(text);
        success = true;
        break;

      } catch (err) {
        lastError = err;
        // Check if this error is a network failure
        const isNetworkError = err.name === 'FetchError' || err.code === 'ENOTFOUND' || err.message.includes('fetch failed');
        if (isNetworkError && attempt < maxRetries) {
          console.warn(`[Network Error] Attempt ${attempt} failed for model ${modelName}. Retrying in ${delay}ms...`, err.message);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        
        // If it's a non-retriable error (or max retries reached), break this inner loop to try next model
        break;
      }
    }

    if (success) {
      return result;
    }

    // Model failed, try the next one if available
    if (mIndex < modelChain.length - 1) {
      console.warn(`[Model Failure] ${modelName} failed. Falling back to next model: ${modelChain[mIndex + 1]}. Error: ${lastError.message}`);
    }
  }

  throw lastError || new Error('Max retries and fallback options exceeded without response');
}

/**
 * Call Groq Cloud API using standard fetch.
 */
async function callGroq(systemPrompt, userPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined in env');
  }

  // Fallback chain for Groq models
  const modelChain = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-8b-8192'];
  let lastError = null;

  for (let mIndex = 0; mIndex < modelChain.length; mIndex++) {
    const modelName = modelChain[mIndex];
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const requestBody = {
      model: modelName,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    };

    const maxRetries = 3;
    let delay = 1000;
    console.log(`[Groq Request] Routing to model: ${modelName}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errText = await response.text();
          let errorMessage = `Groq API error: ${response.status} - ${errText}`;
          try {
            const parsedError = JSON.parse(errText);
            if (parsedError.error && parsedError.error.message) {
              errorMessage = `Groq API error (${response.status}): ${parsedError.error.message}`;
            }
          } catch (parseErr) {
            // keep default
          }

          const isTransient = response.status === 503 || response.status === 429;
          if (isTransient && attempt < maxRetries) {
            console.warn(`[Groq Transient Error ${response.status}] Attempt ${attempt} failed for model ${modelName}. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        const contentText = data.choices?.[0]?.message?.content;
        if (!contentText) {
          throw new Error('Groq returned empty chat completion choices');
        }

        return JSON.parse(contentText);

      } catch (err) {
        lastError = err;
        console.warn(`[Groq Attempt Failed] Model ${modelName} attempt ${attempt} failed: ${err.message}`);
        if (attempt === maxRetries) {
          break;
        }
      }
    }

    if (mIndex < modelChain.length - 1) {
      console.warn(`[Groq Model Failure] ${modelName} failed. Falling back to next model: ${modelChain[mIndex + 1]}. Error: ${lastError.message}`);
    }
  }

  throw lastError || new Error('Max retries and fallback options exceeded without response from Groq');
}

/**
 * Unified AI call router that checks the active AI Provider setting.
 */
async function callAI(systemPrompt, userPrompt, responseSchema = null) {
  let activeProvider = 'gemini'; // default
  try {
    const providerSetting = await Setting.findOne({ key: 'AI_PROVIDER' });
    if (providerSetting && providerSetting.value) {
      activeProvider = providerSetting.value.toLowerCase().trim();
    }
  } catch (err) {
    console.error('Error fetching AI_PROVIDER setting, defaulting to Gemini:', err);
  }

  if (activeProvider === 'groq') {
    return await callGroq(systemPrompt, userPrompt);
  } else {
    return await callGemini(systemPrompt, userPrompt, responseSchema);
  }
}

const cleanQueryName = (name) => {
  return name
    .replace(/^(near|around|nearby|close to|visit|explore|lunch at|dinner at|breakfast at|stay at|shopping at|tea at|coffee at)\s+/i, "")
    .trim();
};

/**
 * Helper to fetch coordinates for a specific schedule item, falling back to a deterministic offset from destination center if geocoding fails.
 */
async function getScheduleItemCoordinates(placeName, city, baseLat, baseLon, index) {
  const cleanedName = cleanQueryName(placeName);
  const query = `${cleanedName}, ${city}`;
  try {
    const coords = await getCoordinates(query);
    if (coords && (coords.lat !== 48.8566 || coords.lon !== 2.3522)) {
      return { lat: coords.lat, lon: coords.lon };
    }
  } catch (err) {
    console.warn(`Geocoding failed for schedule item: ${placeName}`);
  }
  
  // Resilient tight clustering offset fallback (max ~600m from center to keep on land)
  let hash = 0;
  for (let i = 0; i < placeName.length; i++) {
    hash = placeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((Math.abs(hash) % 100) / 100) * 0.008 - 0.004;
  const lngOffset = (((Math.abs(hash) >> 8) % 100) / 100) * 0.008 - 0.004;
  return { lat: baseLat + latOffset, lon: baseLon + lngOffset };
}

/**
 * @desc    Generate a complete trip plan
 * @route   POST /api/ai/generate-trip
 * @access  Private
 */
const generateTrip = async (req, res, next) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      tripType,
      interests,
      accommodationPreference,
      foodPreference,
      transportationPreference,
      specialRequirements
    } = req.body;

    if (!destination || !startDate || !endDate || !budget) {
      return next(new ApiError(400, 'Destination, start date, end date, and budget are required'));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

    // 1. Fetch coords & weather
    const coords = await getCoordinates(destination);
    const weather = await getWeatherForecast(coords.lat, coords.lon, startDate, endDate);

    // 2. Query OpenAI or fallback to mock
    let tripData;
    const systemPrompt = `You are an expert AI Travel Planner and Tourism Consultant.
Generate highly personalized travel itineraries based on destination, budget, travel duration, trip type, traveler preferences, accommodation preferences, food preferences, weather conditions, and nearby attractions.

Provide:
1. Day-wise itinerary (array of days, each with day number, date, and schedule array of times, activities, description, location, cost)
2. Hotel recommendations (name, rating, cost, location, reason, sentiment scoring)
3. Restaurant recommendations (name, cuisine, cost, specialty, sentiment scoring)
4. Tourist attractions (name, category, best time, duration, entry fee, distance)
5. Budget allocation (accommodationBudget, foodBudget, transportationBudget, activityBudget, emergencyBudget)
6. Transportation suggestions
7. Weather-based recommendations
8. Travel tips
9. Risk analysis

You MUST respond ONLY with a valid JSON object matching the following structure:
{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "schedule": [
        { "time": "09:00 AM", "activity": "Activity name", "description": "Brief description", "location": "Location name", "cost": 100 }
      ]
    }
  ],
  "recommendedHotels": [
    {
      "hotelName": "Hotel Name",
      "rating": 4.5,
      "estimatedCost": 4000,
      "location": "Address",
      "reasonForRecommendation": "Reason",
      "sentiment": { "positivePercentage": 85, "neutralPercentage": 10, "negativePercentage": 5, "recommendationScore": 8.5 }
    }
  ],
  "recommendedRestaurants": [
    {
      "restaurantName": "Name",
      "cuisine": "Cuisine",
      "estimatedCost": 800,
      "specialty": "Dish",
      "sentiment": { "positivePercentage": 90, "neutralPercentage": 5, "negativePercentage": 5, "recommendationScore": 9.0 }
    }
  ],
  "attractions": [
    {
      "placeName": "Attraction Name",
      "category": "Beach/Hiking/Museum",
      "bestTimeToVisit": "Morning",
      "estimatedDuration": "2 hours",
      "entryFee": 200,
      "distanceFromDestination": "1.5 km"
    }
  ],
  "budgetBreakdown": {
    "accommodationBudget": 40000,
    "foodBudget": 20000,
    "transportationBudget": 15000,
    "activityBudget": 15000,
    "emergencyBudget": 10000
  },
  "weatherInfo": {
    "forecast": "Forecast summary",
    "warnings": "Warnings or None",
    "recommendations": "What to wear or carry"
  },
  "riskAnalysis": {
    "riskLevel": "Low/Moderate/High",
    "reason": "Risk description",
    "recommendation": "Safety tip"
  }
}`;

    const userPrompt = `Generate a trip to "${destination}" for ${numberOfDays} days (from ${startDate} to ${endDate}).
Details:
- Travelers: ${travelers} (${tripType} trip)
- Budget: INR ${budget}
- Interests: ${interests ? interests.join(', ') : 'any'}
- Accommodation: ${accommodationPreference}
- Food: ${foodPreference}
- Transportation preferred: ${transportationPreference || 'any'}
- Special requirements: ${specialRequirements || 'none'}
- Latitude: ${coords.lat}, Longitude: ${coords.lon}
- Weather context fetched: Forecast: "${weather.forecast}", Warnings: "${weather.warnings}", Recommendations: "${weather.recommendations}". Take this forecast into account, substituting outdoor plans for indoor plans if rainfall is expected.`;

    if (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY) {
      tripData = await callAI(systemPrompt, userPrompt, tripSchema);
    } else {
      throw new ApiError(400, 'AI API Keys (Gemini/Groq) are not configured on the server');
    }

    // Resolve coordinates for all schedule items concurrently and save them inside the schedule subdocuments
    if (tripData.itinerary && tripData.itinerary.length > 0) {
      const geocodePromises = [];
      tripData.itinerary.forEach((dayPlan) => {
        if (dayPlan.schedule && dayPlan.schedule.length > 0) {
          dayPlan.schedule.forEach((item, idx) => {
            const searchName = item.location || item.activity;
            if (searchName) {
              const promise = getScheduleItemCoordinates(searchName, destination, coords.lat, coords.lon, idx)
                .then((itemCoords) => {
                  item.latitude = itemCoords.lat;
                  item.longitude = itemCoords.lon;
                });
              geocodePromises.push(promise);
            }
          });
        }
      });
      await Promise.all(geocodePromises);
    }

    // 3. Save to DB
    const newTrip = await Trip.create({
      userId: req.user._id,
      destination,
      startDate: start,
      endDate: end,
      numberOfDays,
      budget,
      tripType,
      travelers,
      interests: interests || [],
      accommodationPreference: accommodationPreference || 'Standard',
      foodPreference: foodPreference || 'Local Cuisine',
      itinerary: tripData.itinerary,
      attractions: tripData.attractions,
      recommendedHotels: tripData.recommendedHotels,
      recommendedRestaurants: tripData.recommendedRestaurants,
      budgetBreakdown: tripData.budgetBreakdown,
      weatherInfo: tripData.weatherInfo,
      sentimentAnalysis: tripData.sentimentAnalysis || {},
      riskAnalysis: tripData.riskAnalysis,
      latitude: coords.lat,
      longitude: coords.lon,
      chatHistory: [
        {
          role: 'assistant',
          message: `Hello! I have designed a highly personalized travel itinerary to ${destination} for you. Let me know if you would like me to adjust any hotels, restaurants, budget, or activities!`,
          timestamp: new Date()
        }
      ]
    });

    // Create a weather notification for this new trip
    if (newTrip.weatherInfo && newTrip.weatherInfo.forecast) {
      let weatherSummary = newTrip.weatherInfo.forecast || 'Clear skies';
      if (weatherSummary.includes('.')) {
        weatherSummary = weatherSummary.split('.')[0] + '.';
      }
      const message = `${weatherSummary} ${newTrip.weatherInfo.recommendations || ''}`.trim();

      await Notification.create({
        userId: req.user._id,
        tripId: newTrip._id,
        title: `✈️ Upcoming Weather: ${newTrip.destination}`,
        message,
        type: 'weather',
        isRead: false
      });
    }

    // Log AI success call
    await logAiCall({
      userId: req.user._id,
      endpoint: 'generate-trip',
      requestPayload: req.body,
      responsePayload: tripData,
      status: 'Success'
    });

    res.status(201).json({
      success: true,
      message: 'Trip generated successfully',
      data: {
        trip: newTrip
      }
    });
  } catch (error) {
    // Log AI failure call
    await logAiCall({
      userId: req.user._id,
      endpoint: 'generate-trip',
      requestPayload: req.body,
      responsePayload: null,
      status: 'Failure',
      error: error.message
    });
    next(error);
  }
};

/**
 * @desc    AI Chatbot to dynamically modify trip details
 * @route   POST /api/ai/chat
 * @access  Private
 */
const chat = async (req, res, next) => {
  try {
    const { tripId, message } = req.body;

    if (!tripId || !message) {
      return next(new ApiError(400, 'Trip ID and message are required'));
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return next(new ApiError(404, `Trip not found with ID ${tripId}`));
    }

    // Add user message to history
    trip.chatHistory.push({ role: 'user', message, timestamp: new Date() });

    // Prepare OpenAI update call or fallback mock update
    let updatedTripData = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are an expert AI Travel Planner and Tourism Consultant.
You have previously generated a trip itinerary, which is provided in JSON format below.
The user is requesting changes. Adjust the trip data accordingly.
You MUST respond ONLY with the updated JSON object containing the complete modified trip. Maintain the exact same schema.

Current Trip JSON data:
${JSON.stringify({
  destination: trip.destination,
  startDate: trip.startDate,
  endDate: trip.endDate,
  numberOfDays: trip.numberOfDays,
  budget: trip.budget,
  tripType: trip.tripType,
  travelers: trip.travelers,
  accommodationPreference: trip.accommodationPreference,
  foodPreference: trip.foodPreference,
  itinerary: trip.itinerary,
  recommendedHotels: trip.recommendedHotels,
  recommendedRestaurants: trip.recommendedRestaurants,
  attractions: trip.attractions,
  budgetBreakdown: trip.budgetBreakdown,
  weatherInfo: trip.weatherInfo,
  riskAnalysis: trip.riskAnalysis
})}

Modify this JSON strictly based on the user's chat requests. Keep the exact output format.`;

        const userPrompt = `My change request: "${message}". Regenerate the trip and update budget breakdowns, itinerary schedules, hotels, restaurants, or risk levels as appropriate. Return only the JSON object.`;
        
        updatedTripData = await callAI(systemPrompt, userPrompt, tripSchema);
      } catch (err) {
        console.error('AI Chat error:', err);
        throw err;
      }
    } else {
      throw new ApiError(400, 'AI API Keys (Gemini/Groq) are not configured on the server');
    }

    // Save changes back to our model document
    trip.itinerary = updatedTripData.itinerary;
    trip.recommendedHotels = updatedTripData.recommendedHotels;
    trip.recommendedRestaurants = updatedTripData.recommendedRestaurants;
    trip.attractions = updatedTripData.attractions;
    trip.budgetBreakdown = updatedTripData.budgetBreakdown;
    if (updatedTripData.riskAnalysis) trip.riskAnalysis = updatedTripData.riskAnalysis;
    if (updatedTripData.budget) trip.budget = updatedTripData.budget;
    trip.numberOfDays = trip.itinerary.length;
    
    // Calculate new end date based on new itinerary length
    const start = new Date(trip.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (trip.numberOfDays - 1));
    trip.endDate = end;

    // Generate response message
    let responseText = `I have successfully modified the itinerary based on your request: "${message}". `;
    if (message.toLowerCase().includes('vegetarian')) responseText += 'Swapped dining plans to pure vegetarian/vegan venues.';
    else if (message.toLowerCase().includes('budget')) responseText += `Recalibrated budget breakdown to INR ${updatedTripData.budget}.`;
    else if (message.toLowerCase().includes('day')) responseText += `Added a final day (Day ${trip.numberOfDays}) to complete your schedule.`;
    else if (message.toLowerCase().includes('luxury')) responseText += 'Upgraded hotel recommendations to luxury resorts.';
    else responseText += 'Itinerary activities have been refreshed.';

    trip.chatHistory.push({
      role: 'assistant',
      message: responseText,
      timestamp: new Date()
    });

    await trip.save();

    // Log AI success call
    await logAiCall({
      userId: req.user._id,
      endpoint: 'chat',
      requestPayload: req.body,
      responsePayload: updatedTripData,
      status: 'Success'
    });

    res.status(200).json({
      success: true,
      message: 'Trip updated via assistant chat',
      data: {
        trip
      }
    });
  } catch (error) {
    // Log AI failure call
    await logAiCall({
      userId: req.user._id,
      endpoint: 'chat',
      requestPayload: req.body,
      responsePayload: null,
      status: 'Failure',
      error: error.message
    });
    next(error);
  }
};

/**
 * @desc    Standalone endpoint to recommend hotels
 * @route   POST /api/ai/recommend-hotels
 * @access  Private
 */
const recommendHotels = async (req, res, next) => {
  try {
    const { destination, budget, preference } = req.body;
    if (!destination) return next(new ApiError(400, 'Destination is required'));

    // We can simulate an OpenAI call for hotel recommendations
    res.status(200).json({
      success: true,
      data: {
        hotels: [
          { hotelName: `${destination} Heritage Inn`, rating: 4.6, estimatedCost: 3500, location: `Central ${destination}`, reasonForRecommendation: `Excellent rating and matches your ${preference || 'Standard'} preference.` },
          { hotelName: `${destination} Luxury Suites`, rating: 4.9, estimatedCost: 8500, location: `Main Boulevard, ${destination}`, reasonForRecommendation: 'Premium comfort and top-tier customer reviews.' }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Standalone endpoint to recommend food
 * @route   POST /api/ai/recommend-food
 * @access  Private
 */
const recommendFood = async (req, res, next) => {
  try {
    const { destination, foodPreference } = req.body;
    if (!destination) return next(new ApiError(400, 'Destination is required'));

    res.status(200).json({
      success: true,
      data: {
        restaurants: [
          { restaurantName: 'Spice & Soul Bistro', cuisine: foodPreference || 'Local Specialties', estimatedCost: 600, specialty: 'Clay-oven Baked Bread & Gravy' },
          { restaurantName: 'Greenery Garden Cafe', cuisine: 'Continental & Organic', estimatedCost: 450, specialty: 'Handcrafted Sandwiches & Cold Press Juices' }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Standalone endpoint to optimize budget
 * @route   POST /api/ai/optimize-budget
 * @access  Private
 */
const optimizeBudget = async (req, res, next) => {
  try {
    const { budget } = req.body;
    if (!budget) return next(new ApiError(400, 'Budget is required'));

    const b = Number(budget);
    res.status(200).json({
      success: true,
      data: {
        budgetBreakdown: {
          accommodationBudget: Math.round(b * 0.4),
          foodBudget: Math.round(b * 0.25),
          transportationBudget: Math.round(b * 0.15),
          activityBudget: Math.round(b * 0.12),
          emergencyBudget: Math.round(b * 0.08)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Standalone endpoint to analyze risk
 * @route   POST /api/ai/analyze-risk
 * @access  Private
 */
const analyzeRisk = async (req, res, next) => {
  try {
    const { destination, budget } = req.body;
    res.status(200).json({
      success: true,
      data: {
        riskAnalysis: {
          riskLevel: budget < 10000 ? 'Moderate' : 'Low',
          reason: budget < 10000 ? 'Low budget limit for destination.' : 'Normal safety profile.',
          recommendation: 'Register at local embassy, keep digital documents, use authorized guides.'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to fetch image from Unsplash API
 */
async function fetchImageFromUnsplash(query, apiKey) {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
  } catch (e) {
    console.error("Unsplash API Error:", e);
  }
  return null;
}

/**
 * Helper to fetch image from Pexels API
 */
async function fetchImageFromPexels(query, apiKey) {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large;
    }
  } catch (e) {
    console.error("Pexels API Error:", e);
  }
  return null;
}

/**
 * Helper to resolve cover image from APIs or LoremFlickr fallback
 */
async function resolveCoverImage(query, destination) {
  const unsplashKey = process.env.UNSPLASH_API_KEY;
  const pexelsKey = process.env.PEXELS_API_KEY;
  const searchQuery = query || destination;

  try {
    if (unsplashKey) {
      const url = await fetchImageFromUnsplash(searchQuery, unsplashKey);
      if (url) return url;
    }
    if (pexelsKey) {
      const url = await fetchImageFromPexels(searchQuery, pexelsKey);
      if (url) return url;
    }
  } catch (err) {
    console.error('Image resolving error:', err);
  }

  // Keyless fallback: LoremFlickr
  const cleanWords = (str) => {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s,]/g, '')
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .join(',');
  };
  return `https://loremflickr.com/500/350/${cleanWords(searchQuery)}`;
}

/**
 * Local rule-based mock explorer generator
 */
function generateMockExplorerData(destination, category) {
  if (category === 'attractions') {
    return [
      { name: `${destination} Historical Center`, type: "Historic Landmark", description: `A stunning preserved district showing the unique architectural history of ${destination}.`, rating: 4.8, imageSearchQuery: "historical, architecture", highlights: ["Guided walking tours", "Great photography opportunities", "Wheelchair accessible"], bestTime: "Morning 9 AM", fee: "Free admission" },
      { name: `${destination} Botanical Garden`, type: "Park", description: "Vast landscaped lawns displaying rare native flora, water fountains, and greenhouses.", rating: 4.6, imageSearchQuery: "botanical, garden", highlights: ["Peaceful walks", "Interactive children zone", "Cafeteria on-site"], bestTime: "Late afternoon", fee: "Approx. ₹150" },
      { name: "Sunset Viewpoint Ridge", type: "Nature Reserve", description: "Elevated path that offers breathtaking panoramic views of the entire valley during twilight.", rating: 4.9, imageSearchQuery: "mountain, sunset", highlights: ["Breathtaking sunset views", "Slightly steep climb", "Bring water"], bestTime: "Sunset", fee: "Free admission" },
      { name: "Art & Culture Museum", type: "Museum", description: "Explore traditional artifacts, sculptures, and galleries presenting local history and heritage.", rating: 4.5, imageSearchQuery: "museum, gallery", highlights: ["Audio guide available", "Gift store", "Air conditioned"], bestTime: "Afternoon 2 PM", fee: "Approx. ₹250" },
      { name: "Riverside Promenade", type: "Nature Reserve", description: "Beautiful brick walkway along the riverbanks, filled with street performers and cafes.", rating: 4.7, imageSearchQuery: "river, city", highlights: ["Boating rentals nearby", "Vibrant evening vibe", "Pet friendly"], bestTime: "Evening", fee: "Free admission" }
    ];
  } else if (category === 'hotels') {
    return [
      { name: `${destination} Heritage Hotel`, type: "Boutique Hotel", description: "Charming traditional lodging featuring local design motifs, courtyards, and organic dining.", rating: 4.7, imageSearchQuery: "boutique, hotel", priceRange: "$80 - $120/night", amenities: ["Free organic breakfast", "Airport transfer", "Heritage courtyard"], locationSummary: "Located in the heart of Downtown" },
      { name: "Grand Vista Luxury Resort", type: "Luxury Resort", description: "High-end resort offering panoramic rooms, premium spas, and multiple infinity pools.", rating: 4.9, imageSearchQuery: "luxury, resort", priceRange: "Luxury Premium", amenities: ["Infinity pool", "Full service spa", "Fine dining", "Beachfront access"], locationSummary: "Steps away from the main beach" },
      { name: "Eco-Lodge Sanctuary", type: "Eco-Lodge", description: "Sustainable wooden cabins tucked inside forest canopies, promoting low carbon footprint.", rating: 4.6, imageSearchQuery: "cabin, forest", priceRange: "$100 - $150/night", amenities: ["Solar powered", "Guided forest walks", "Local organic kitchen"], locationSummary: "Surrounded by nature reserves" },
      { name: "Backpackers Central Hostel", type: "Budget Hostel", description: "Vibrant, budget-friendly shared dorms and common lounges perfect for solo travelers.", rating: 4.4, imageSearchQuery: "hostel, lobby", priceRange: "$20 - $35/night", amenities: ["Shared kitchen", "Co-working space", "Weekly social events"], locationSummary: "Right next to the central transit hub" },
      { name: "Valley View Suites", type: "Boutique Hotel", description: "Modern, spacious suites equipped with private balconies overlooking valley ridges.", rating: 4.5, imageSearchQuery: "hotel, room", priceRange: "$70 - $100/night", amenities: ["Private balcony", "High speed Wi-Fi", "Fitness center"], locationSummary: "10 minutes walk from historic center" }
    ];
  } else if (category === 'food') {
    return [
      { name: "Signature Spice Curry", type: "Traditional Specialty", description: `A slow-simmered rich aromatic gravy representing the true culinary soul of ${destination}.`, rating: 4.8, imageSearchQuery: "curry, rice", priceRange: "Budget-friendly", recommendedPlaces: ["Street Food Market", "The Spice Pot"], keyIngredients: ["Aromatic spices", "Local coconut cream", "Choice of protein"] },
      { name: "Crispy Clay-Oven Flatbread", type: "Street Food Stall", description: "Freshly slapped flatbread baked on hot clay ovens, served hot with melted herb butter.", rating: 4.7, imageSearchQuery: "flatbread", priceRange: "$", recommendedPlaces: ["Central Bakery Corner", "Oven Alley"], keyIngredients: ["Refined wheat", "Herb butter", "Garlic cloves"] },
      { name: "Riverside Garden Cafe", type: "Scenic Cafe", description: "Cozy café serving custom-brewed local coffees and organic pastries on the riverfront.", rating: 4.6, imageSearchQuery: "cafe, coffee", priceRange: "$$", recommendedPlaces: ["The River Walkway"], keyIngredients: ["Single origin beans", "Pastry flour", "Organic honey"] },
      { name: "Royal Fusion Diner", type: "Fine Dining", description: "Elevated cuisine blending traditional recipes with modern cooking methods and plating.", rating: 4.9, imageSearchQuery: "fine, dining", priceRange: "Premium", recommendedPlaces: ["High Street Vista"], keyIngredients: ["Truffle essence", "Aged saffron threads", "Handcrafted oils"] },
      { name: "Sweet Coconut Dumpling", type: "Traditional Specialty", description: "Sweet dumplings steamed in banana leaves, stuffed with shredded coconut and local brown palm sugar.", rating: 4.5, imageSearchQuery: "dumpling", priceRange: "$", recommendedPlaces: ["Dadi's Sweet shop", "Nite Bazar"], keyIngredients: ["Rice flour", "Shredded coconut", "Palm jaggery"] }
    ];
  } else {
    return {
      title: `3 Perfect Days in ${destination}`,
      overview: `A comprehensive three-day showcase of ${destination}'s prime historic points, natural wonders, and signature dining spots, crafted at an easy-going pace.`,
      days: [
        {
          day: 1,
          theme: "Heritage & Local Vibes",
          activities: [
            { time: "09:00 AM", name: "Walking Tour of Historic Quarter", description: "Walk through medieval gates, cobblestone lanes, and admire the beautiful architectural heritage." },
            { time: "01:00 PM", name: "Traditional Lunch at Local Kitchen", description: "Savor the signature slow-simmered curry and clay-oven flatbreads at a highly-rated family joint." },
            { time: "03:00 PM", name: "Central Art Museum", description: "Browse traditional paintings, sculptures, and historical relics detailing the region's ancient origins." }
          ]
        },
        {
          day: 2,
          theme: "Nature & Sunset Views",
          activities: [
            { time: "08:30 AM", name: "Botanical Gardens Canopy Trail", description: "Stroll along landscaped tracks, greenhouse orchids, and enjoy early morning bird chirping." },
            { time: "12:30 PM", name: "Picnic by Riverside Promenade", description: "Take a relaxing break by the riverbanks, with option to hire rowing boats." },
            { time: "04:30 PM", name: "Trek to Sunset Viewpoint Ridge", description: "Climb up the ridge trail to capture a panoramic twilight overlooking the entire landscape." }
          ]
        },
        {
          day: 3,
          theme: "Local Crafts & Farewell Dine",
          activities: [
            { time: "09:30 AM", name: "Souvenir hunting in Old Market", description: "Browse handwoven shawls, spices, woodwork, and unique local crafts directly from local artisans." },
            { time: "01:30 PM", name: "Organic Café Brunch", description: "Enjoy fresh artisan roasted coffees and local pastries at a scenic riverside garden cafe." },
            { time: "07:00 PM", name: "Royal Fusion Farewell Dinner", description: "Cap off your trip with a premium dining experience blending traditional cooking with gourmet plating." }
          ]
        }
      ]
    };
  }
}

/**
 * @desc    Standalone endpoint to explore destination by category (attractions, hotels, food, itinerary)
 * @route   POST /api/ai/explore-destination
 * @access  Private
 */
const exploreDestination = async (req, res, next) => {
  try {
    const { destination, category } = req.body;
    if (!destination || !category) {
      return next(new ApiError(400, 'Destination and category are required'));
    }

    const systemPrompt = `You are an expert AI Travel Planner and Tourism Consultant.
Generate highly personalized travel content based on destination and category.
You MUST respond ONLY with a valid JSON object or JSON array matching the schema instructions in user prompt. Do not add markdown backticks like \`\`\`json or text outside the JSON.`;

    let prompt = '';
    switch (category) {
      case 'attractions':
        prompt = `List 5 top tourist locations/attractions in '${destination}'. Return a JSON array of objects. Each object must have exactly these keys:
- "name": (string, name of attraction)
- "type": (string, e.g., "Museum", "Park", "Historic Landmark", "Nature Reserve")
- "description": (string, 2-3 engaging sentences highlighting what makes it special)
- "rating": (number between 4.0 and 5.0, representative estimated rating)
- "imageSearchQuery": (string, a 2-3 word search query to find a representative photo of this place. Use only broad, common English terms, e.g. "waterfall, kerala", "backwaters, kerala", "temple, india", "beach, ocean". Do NOT include specific names.)
- "highlights": (array of strings, e.g., ["Breathtaking panoramic view", "Guided audio tours", "No entrance fee"])
- "bestTime": (string, e.g., "Early morning", "Late afternoon for sunset", "Autumn months")
- "fee": (string, e.g., "$15 USD", "Free admission", "Approx. €10")`;
        break;

      case 'hotels':
        prompt = `Recommend 5 popular lodging/hotels in or very near to '${destination}'. Return a JSON array of objects. Each object must have exactly these keys:
- "name": (string, name of hotel or resort)
- "type": (string, e.g., "Boutique Hotel", "Luxury Resort", "Eco-Lodge", "Budget Hostel")
- "description": (string, 2-3 engaging sentences describing the vibe and rooms)
- "rating": (number between 4.0 and 5.0, representative rating)
- "imageSearchQuery": (string, a 2-3 word search query to find a photo representing this lodging. Use only broad, common English terms, e.g. "luxury, resort", "hotel, lobby", "resort, pool", "cabin, forest". Do NOT include specific hotel names.)
- "priceRange": (string, e.g., "$$", "$$$", "$80 - $120/night", "Luxury Premium")
- "amenities": (array of strings, e.g., ["Rooftop pool", "Free organic breakfast", "Spa & Wellness center", "Pet friendly"])
- "locationSummary": (string, e.g., "Located in the heart of Downtown", "Steps away from the main beach")`;
        break;

      case 'food':
        prompt = `Recommend 5 must-try local specialties, street foods, or iconic dining spots in '${destination}'. Return a JSON array of objects. Each object must have exactly these keys:
- "name": (string, name of food item or restaurant)
- "type": (string, e.g., "Traditional Specialty", "Street Food Stall", "Scenic Cafe", "Fine Dining")
- "description": (string, 2-3 engaging sentences explaining the ingredients, history, or taste)
- "rating": (number between 4.0 and 5.0, typical popularity rating)
- "imageSearchQuery": (string, a 2-3 word search query to find a photo representing this food item. Use only broad, common English terms, e.g. "curry, rice", "seafood, platter", "ramen, bowl", "street, food, india". Do NOT include specific restaurant names.)
- "priceRange": (string, e.g., "$", "$$", "Budget-friendly", "Premium")
- "recommendedPlaces": (array of strings, list of 2 eateries or neighborhoods to buy this)
- "keyIngredients": (array of strings, e.g., ["Fresh octopus", "Sweet soy reduction", "Rice flour"])`;
        break;

      case 'itinerary':
        prompt = `Create a detailed 3-day travel itinerary for '${destination}'. Return a JSON object with:
- "title": (string, e.g., "3 Perfect Days in ${destination}")
- "overview": (string, 2-3 sentences introducing the itinerary theme and pace)
- "days": (array of 3 day objects). Each day object must have:
  - "day": (number, e.g., 1, 2, 3)
  - "theme": (string, theme of the day, e.g., "Historic Heart & Hidden Temples")
  - "activities": (array of 3 activity objects). Each activity object must have:
    - "time": (string, e.g., "09:00 AM", "Afternoon", "Evening")
    - "name": (string, name of activity or spot)
    - "description": (string, 2-3 sentences about what to do there and helpful visitor tips)`;
        break;

      default:
        return next(new ApiError(400, 'Invalid exploration category'));
    }

    let parsedData;
    if (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY) {
      let schema = null;
      if (category === 'hotels') schema = hotelsSchema;
      else if (category === 'food') schema = foodSchema;
      else if (category === 'attractions') schema = attractionsSchema;
      else if (category === 'itinerary') schema = itinerarySchema;

      parsedData = await callAI(systemPrompt, prompt, schema);
    } else {
      throw new ApiError(400, 'AI API Keys (Gemini/Groq) are not configured on the server');
    }

    // Resolve images on the server side to save client requests and keep it secure
    if (category !== 'itinerary') {
      const items = Array.isArray(parsedData) ? parsedData : (Object.values(parsedData).find(val => Array.isArray(val)) || []);
      
      const resolvedItems = await Promise.all(items.map(async (item) => {
        const imageUrl = await resolveCoverImage(item.imageSearchQuery, destination);
        return {
          ...item,
          imageUrl
        };
      }));
      parsedData = resolvedItems;
    }

    // Log AI success call
    await logAiCall({
      userId: req.user._id,
      endpoint: 'explore-destination',
      requestPayload: req.body,
      responsePayload: parsedData,
      status: 'Success'
    });

    res.status(200).json({
      success: true,
      message: `${category} retrieved successfully`,
      data: parsedData
    });
  } catch (error) {
    // Log AI failure call
    await logAiCall({
      userId: req.user._id,
      endpoint: 'explore-destination',
      requestPayload: req.body,
      responsePayload: null,
      status: 'Failure',
      error: error.message
    });
    next(error);
  }
};

/**
 * Helper to analyze the sentiment of a text block using Gemini
 */
async function analyzeSentimentText(text) {
  if (!text || !text.trim()) {
    return {
      label: 'Neutral',
      score: 0,
      keywords: [],
      confidence: 1.0
    };
  }

  const systemPrompt = `You are an advanced sentiment analysis engine. Analyze the travel-related review text provided by the user.
Extract:
1. The sentiment label: strictly "Positive", "Neutral", or "Negative".
2. A sentiment score between -1.0 (extremely negative) and 1.0 (extremely positive). 0.0 is neutral.
3. Up to 5 key descriptive keywords or emotional indicators from the text.
4. A confidence score between 0.0 and 1.0.

Return strictly a JSON object matching the required schema.`;

  try {
    const response = await callAI(systemPrompt, `Review text to analyze: "${text}"`, sentimentSchema);
    return response;
  } catch (err) {
    console.error('Error in analyzeSentimentText:', err);
    // Return standard fallback on error
    return {
      label: 'Neutral',
      score: 0,
      keywords: [],
      confidence: 0.5
    };
  }
}

/**
 * @desc    Predict destination/landmark from uploaded image
 * @route   POST /api/ai/predict-destination
 * @access  Private
 */
const predictDestinationFromImage = async (req, res, next) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return next(new ApiError(400, 'Base64 image data and mimeType are required'));
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return next(new ApiError(400, 'GEMINI_API_KEY is not defined in env'));
    }

    // Set up structured schema to ensure we get a reliable JSON response
    const predictionSchema = {
      type: "object",
      properties: {
        destination: { type: "string" },
        location: { type: "string" },
        description: { type: "string" }
      },
      required: ["destination", "location", "description"]
    };

    const systemPrompt = `You are a professional travel guide and image identification engine. Identify the tourist destination, landmark, city, or scenic spot displayed in the user's image. 
Return strictly a JSON object with:
1. "destination": the specific name of the landmark or tourist destination.
2. "location": the city, state/region, and country where this destination is located.
3. "description": a paragraph (3-4 sentences) describing its historical, cultural, or scenic importance and key things to do.`;

    const modelName = 'gemini-flash-latest'; // Always use a vision-capable multimodal model for images
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const modelChain = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = null;
    let success = false;
    let parsedData = null;

    for (let mIndex = 0; mIndex < modelChain.length; mIndex++) {
      const modelName = modelChain[mIndex];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: image
                }
              },
              {
                text: systemPrompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: predictionSchema,
          temperature: 0.2
        }
      };

      const maxRetries = 3;
      let delay = 1000;
      console.log(`[Gemini Request] Routing image prediction to model: ${modelName}`);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errText = await response.text();
            let errorMessage = `Gemini API error: ${response.status} - ${errText}`;
            try {
              const parsedError = JSON.parse(errText);
              if (parsedError.error && parsedError.error.message) {
                errorMessage = `Gemini API error (${response.status}): ${parsedError.error.message}`;
              }
            } catch (parseErr) {}

            const isTransient = response.status === 503 || response.status === 429;
            if (isTransient && attempt < maxRetries) {
              console.warn(`[Vision Transient Error ${response.status}] Attempt ${attempt} failed for model ${modelName}. Retrying in ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              delay *= 2;
              continue;
            }

            throw new Error(errorMessage);
          }

          const jsonResult = await response.json();
          if (!jsonResult.candidates || !jsonResult.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Gemini API returned no analysis output');
          }

          const resultText = jsonResult.candidates[0].content.parts[0].text;
          parsedData = JSON.parse(resultText);
          success = true;
          break;

        } catch (err) {
          lastError = err;
          console.warn(`[Vision Attempt Failed] Model ${modelName} attempt ${attempt} failed: ${err.message}`);
          if (attempt === maxRetries) {
            break;
          }
        }
      }

      if (success) {
        break;
      }

      if (mIndex < modelChain.length - 1) {
        console.warn(`[Vision Model Failure] ${modelName} failed. Falling back to next model: ${modelChain[mIndex + 1]}. Error: ${lastError.message}`);
      }
    }

    if (!success) {
      throw lastError || new Error('Max retries and fallback options exceeded without image analysis response');
    }

    res.status(200).json({
      success: true,
      message: 'Image analyzed successfully',
      data: parsedData
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateTrip,
  chat,
  recommendHotels,
  recommendFood,
  optimizeBudget,
  analyzeRisk,
  exploreDestination,
  analyzeSentimentText,
  predictDestinationFromImage
};
