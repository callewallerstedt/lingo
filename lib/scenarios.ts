export type ScenarioDefinition = {
  id: string;
  title: string;
  subtitle: string;
  roleGuide: string;
  startPrompt: string;
};

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: "cafe",
    title: "Cafe",
    subtitle: "Order a drink and a small item, then pay.",
    roleGuide:
      "Role: barista. Keep it brief and transactional. Focus on order details, size, milk, and payment.",
    startPrompt:
      "Start with a short, common barista opener in the target language.",
  },
  {
    id: "restaurant",
    title: "Restaurant",
    subtitle: "Order a meal, ask about a dish, and close the check.",
    roleGuide:
      "Role: waiter. Be professional and concise. Offer menus or specials and confirm the order.",
    startPrompt:
      "Start with a standard waiter opener in the target language.",
  },
  {
    id: "bakery",
    title: "Bakery",
    subtitle: "Pick two items and ask about ingredients.",
    roleGuide:
      "Role: bakery clerk. Keep it short, focus on items, quantities, and payment.",
    startPrompt:
      "Start with a short, friendly service opener in the target language.",
  },
  {
    id: "grocery",
    title: "Grocery Store",
    subtitle: "Ask where something is and buy it.",
    roleGuide:
      "Role: store staff. Be helpful and direct. Focus on aisles, brands, and prices.",
    startPrompt:
      "Start with a simple offer of help in the target language.",
  },
  {
    id: "pharmacy",
    title: "Pharmacy",
    subtitle: "Describe a symptom and ask for a basic remedy.",
    roleGuide:
      "Role: pharmacist. Be calm and concise. Ask about symptoms and allergies.",
    startPrompt:
      "Start with a short, professional greeting in the target language.",
  },
  {
    id: "hotel",
    title: "Hotel Check-in",
    subtitle: "Check in, confirm details, and ask about breakfast.",
    roleGuide:
      "Role: front desk staff. Be polite and efficient. Confirm booking details.",
    startPrompt:
      "Start with a standard check-in greeting in the target language.",
  },
  {
    id: "airport",
    title: "Airport Check-in",
    subtitle: "Check a bag and confirm your seat.",
    roleGuide:
      "Role: airline agent. Be direct and procedural. Ask about passport and baggage.",
    startPrompt:
      "Start with a short check-in question in the target language.",
  },
  {
    id: "customs",
    title: "Customs",
    subtitle: "Answer travel purpose and duration.",
    roleGuide:
      "Role: customs officer. Be formal, brief, and direct. Ask about purpose and length of stay.",
    startPrompt:
      "Start with a direct customs question in the target language.",
  },
  {
    id: "taxi",
    title: "Taxi Ride",
    subtitle: "Give a destination and clarify a route.",
    roleGuide:
      "Role: taxi driver. Be short and practical. Confirm destination and route.",
    startPrompt:
      "Start with a brief question about destination in the target language.",
  },
  {
    id: "train",
    title: "Train Station",
    subtitle: "Buy a ticket and ask about the platform.",
    roleGuide:
      "Role: ticket clerk. Be quick and clear. Ask about destination and time.",
    startPrompt:
      "Start with a short ticket question in the target language.",
  },
  {
    id: "doctor",
    title: "Doctor Visit",
    subtitle: "Describe symptoms and answer follow-up questions.",
    roleGuide:
      "Role: doctor. Be calm and concise. Ask about symptoms and duration.",
    startPrompt:
      "Start with a clinical opener like asking what brings them in.",
  },
  {
    id: "job",
    title: "Job Interview",
    subtitle: "Answer a question about experience and skills.",
    roleGuide:
      "Role: interviewer. Be professional and structured. Ask clear questions.",
    startPrompt:
      "Start with a professional greeting and a first question.",
  },
  {
    id: "first-day",
    title: "First Day at Work",
    subtitle: "Introduce yourself and ask a simple question.",
    roleGuide:
      "Role: coworker. Be friendly and brief. Ask about their role or tasks.",
    startPrompt:
      "Start with a short welcome in the target language.",
  },
  {
    id: "apartment",
    title: "Apartment Viewing",
    subtitle: "Ask about rent, utilities, and move-in date.",
    roleGuide:
      "Role: landlord or agent. Be direct. Answer questions about costs and terms.",
    startPrompt:
      "Start with a brief greeting and offer to show the place.",
  },
  {
    id: "bank",
    title: "Bank",
    subtitle: "Ask about opening an account and required documents.",
    roleGuide:
      "Role: bank teller. Be formal and concise. Ask for ID and requirements.",
    startPrompt:
      "Start with a standard service greeting in the target language.",
  },
  {
    id: "gym",
    title: "Gym",
    subtitle: "Ask about memberships and opening hours.",
    roleGuide:
      "Role: front desk staff. Be brief and helpful. Provide membership details.",
    startPrompt:
      "Start with a short greeting and ask how you can help.",
  },
  {
    id: "salon",
    title: "Hair Salon",
    subtitle: "Book a haircut and describe a style.",
    roleGuide:
      "Role: stylist or receptionist. Be friendly and concise. Ask about time and style.",
    startPrompt:
      "Start with a short greeting and ask what they want.",
  },
  {
    id: "post",
    title: "Post Office",
    subtitle: "Send a package and ask about delivery time.",
    roleGuide:
      "Role: clerk. Be direct. Ask about destination, size, and speed.",
    startPrompt:
      "Start with a short service greeting in the target language.",
  },
  {
    id: "tech",
    title: "Tech Support",
    subtitle: "Describe a device problem and follow steps.",
    roleGuide:
      "Role: support agent. Be clear and step-by-step. Ask for details.",
    startPrompt:
      "Start with a brief help offer in the target language.",
  },
  {
    id: "movie",
    title: "Cinema",
    subtitle: "Buy a ticket and ask about showtimes.",
    roleGuide:
      "Role: ticket clerk. Be short and practical. Ask about time and seats.",
    startPrompt:
      "Start with a short ticket question in the target language.",
  },
  {
    id: "museum",
    title: "Museum",
    subtitle: "Ask about tickets and a specific exhibit.",
    roleGuide:
      "Role: staff. Be polite and concise. Explain tickets and directions.",
    startPrompt:
      "Start with a simple greeting in the target language.",
  },
  {
    id: "market",
    title: "Farmers Market",
    subtitle: "Ask about price and quantity, then buy.",
    roleGuide:
      "Role: vendor. Be friendly and short. Talk about price and freshness.",
    startPrompt:
      "Start with a simple greeting in the target language.",
  },
  {
    id: "dating",
    title: "Dating",
    subtitle: "Introduce yourself and ask a light question.",
    roleGuide:
      "Role: date. Friendly, natural, and concise. Keep it light.",
    startPrompt:
      "Start with a friendly greeting and a simple question.",
  },
  {
    id: "family",
    title: "Family Gathering",
    subtitle: "Introduce yourself and ask about someone.",
    roleGuide:
      "Role: family member. Warm but not too chatty. Ask a natural question.",
    startPrompt:
      "Start with a warm greeting tied to the gathering.",
  },
  {
    id: "school",
    title: "School",
    subtitle: "Ask about homework and a class topic.",
    roleGuide:
      "Role: classmate. Casual and concise. Focus on school topics.",
    startPrompt:
      "Start with a short school-related opener.",
  },
];
