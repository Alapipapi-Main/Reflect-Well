
export interface SecondaryEmotion {
  name: string;
  definition: string;
  prompt: string;
}

export interface PrimaryEmotion {
  name: string;
  color: string; // Tailwind CSS class for background color
  emoji: string;
  emotions: SecondaryEmotion[];
}

export const EMOTIONS: PrimaryEmotion[] = [
  {
    name: 'Joy',
    emoji: '😄',
    color: 'bg-yellow-400',
    emotions: [
      {
        name: 'Contentment',
        definition: 'A state of peaceful happiness and satisfaction.',
        prompt: 'What small thing today brought you a sense of simple satisfaction?',
      },
      {
        name: 'Optimism',
        definition: 'Hopefulness and confidence about the future or the successful outcome of something.',
        prompt: 'What are you looking forward to right now, and what makes you hopeful about it?',
      },
      {
        name: 'Pride',
        definition: 'A feeling of deep pleasure or satisfaction derived from one\'s own achievements.',
        prompt: 'Write about something you accomplished recently that made you feel proud, no matter how small.',
      },
      {
        name: 'Excitement',
        definition: 'A feeling of great enthusiasm and eagerness.',
        prompt: 'What is currently sparking a sense of excitement or anticipation in your life?',
      },
      {
        name: 'Relief',
        definition: 'A feeling of reassurance and relaxation following release from anxiety or distress.',
        prompt: 'Describe a moment when a weight was lifted off your shoulders. What did that feel like?',
      },
    ],
  },
  {
    name: 'Sadness',
    emoji: '😢',
    color: 'bg-blue-500',
    emotions: [
      {
        name: 'Disappointment',
        definition: 'Sadness or displeasure caused by the non-fulfillment of one\'s hopes or expectations.',
        prompt: 'Acknowledge something that didn\'t go as planned. What were your hopes, and how do you feel now?',
      },
      {
        name: 'Melancholy',
        definition: 'A feeling of pensive sadness, typically with no obvious cause.',
        prompt: 'If this quiet sadness had a color or a sound, what would it be? Describe it without judgment.',
      },
      {
        name: 'Loneliness',
        definition: 'Sadness because one has no friends or company.',
        prompt: 'In what ways do you feel disconnected right now? What kind of connection do you crave?',
      },
      {
        name: 'Grief',
        definition: 'Deep sorrow, especially that caused by someone\'s death.',
        prompt: 'Grief is a heavy burden. What memory of what you\'ve lost are you holding onto today?',
      },
      {
        name: 'Remorse',
        definition: 'Deep regret or guilt for a wrong committed.',
        prompt: 'What past action is weighing on your mind? What can you learn from it for the future?',
      },
    ],
  },
  {
    name: 'Anger',
    emoji: '😠',
    color: 'bg-red-500',
    emotions: [
      {
        name: 'Frustration',
        definition: 'The feeling of being upset or annoyed as a result of being unable to change or achieve something.',
        prompt: 'What is blocking your path right now? Describe the obstacle and the feeling of being stuck.',
      },
      {
        name: 'Irritation',
        definition: 'The state of feeling annoyed, impatient, or slightly angry.',
        prompt: 'What small annoyance is grating on you today? Write it down to let it go.',
      },
      {
        name: 'Bitterness',
        definition: 'Anger and disappointment at being treated unfairly; resentment.',
        prompt: 'What injustice or unfairness are you holding onto? What would it take to soften that feeling?',
      },
      {
        name: 'Jealousy',
        definition: 'The state or feeling of being envious of someone\'s achievements and advantages.',
        prompt: 'Jealousy often points to something we desire. What does the person you envy have that you wish for yourself?',
      },
      {
        name: 'Rage',
        definition: 'Violent, uncontrollable anger.',
        prompt: 'If you could safely express the full force of your rage, what would it look like? What is at the core of this intense feeling?',
      },
    ],
  },
  {
    name: 'Fear',
    emoji: '😨',
    color: 'bg-purple-500',
    emotions: [
      {
        name: 'Anxiety',
        definition: 'A feeling of worry, nervousness, or unease, typically about an imminent event or something with an uncertain outcome.',
        prompt: 'What "what if" scenario is looping in your mind? Write down the worst-case scenario, and then a more realistic one.',
      },
      {
        name: 'Insecurity',
        definition: 'Uncertainty or anxiety about oneself; lack of confidence.',
        prompt: 'What situation is making you doubt yourself? What is one small strength you possess that can help you face it?',
      },
      {
        name: 'Apprehension',
        definition: 'Anxiety or fear that something bad or unpleasant will happen.',
        prompt: 'What upcoming event is causing you to feel uneasy? What part of it is most daunting?',
      },
      {
        name: 'Vulnerability',
        definition: 'The quality or state of being exposed to the possibility of being attacked or harmed, either physically or emotionally.',
        prompt: 'Describe a situation where you feel exposed or unprotected. What would make you feel safer?',
      },
    ],
  },
  {
    name: 'Surprise',
    emoji: '😮',
    color: 'bg-teal-500',
    emotions: [
      {
        name: 'Amazement',
        definition: 'A feeling of great surprise or wonder.',
        prompt: 'What was the last thing that genuinely amazed you? Describe the moment in detail.',
      },
      {
        name: 'Awe',
        definition: 'A feeling of reverential respect mixed with fear or wonder.',
        prompt: 'Describe something you\'ve witnessed that was so vast or beautiful it made you feel small in a good way.',
      },
      {
        name: 'Disbelief',
        definition: 'Inability or refusal to accept that something is true or real.',
        prompt: 'What have you recently seen or heard that was hard to believe? What was your initial reaction?',
      },
      {
        name: 'Confusion',
        definition: 'Lack of understanding; uncertainty.',
        prompt: 'What situation is currently unclear to you? What are the pieces of the puzzle that don\'t seem to fit?',
      },
    ],
  },
];
