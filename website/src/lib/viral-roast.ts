/**
 * viral-roast.ts — Humorous Astrological Roasts
 * 
 * Generates witty, "toxic-positive" roasts for each sign to drive
 * social sharing. Based on the Growth Playbook's viral loop strategy.
 */

export interface ZodiacRoast {
  sign: string;
  tagline: string;
  roast: string;
  advice: string;
}

const ROASTS: Record<string, Omit<ZodiacRoast, "sign">> = {
  Aries: {
    tagline: "Unstoppable Force, questionable direction.",
    roast: "You have two speeds: 'Everything is a race' and 'Why is everyone so slow?'. Your impulse control is essentially just a suggestion you've decided to ignore for 20+ years.",
    advice: "Try counting to ten before you send that 'per my last email' text. Or just five. Baby steps.",
  },
  Taurus: {
    tagline: "Luxury-obsessed boulder.",
    roast: "You're not 'persistent,' you're just physically unable to change your mind once you've decided which $15 candle to buy. You'd stay in a burning building if the sheets were high thread-count.",
    advice: "The comfort zone is great, but maybe try leaving it once this quarter? The outdoors has snacks too.",
  },
  Gemini: {
    tagline: "Walking group chat.",
    roast: "You have 47 tabs open in your brain and most of them are playing auto-play video ads you can't find. You're a social butterfly, but the butterfly has ADHD and forgot why it's at the party.",
    advice: "Pick one personality and stick with it for at least a full weekend. Your friends' nervous systems will thank you.",
  },
  Cancer: {
    tagline: "Emotional exoskeleton.",
    roast: "You're a professional at winning arguments that haven't happened yet while crying in the shower. You remember what someone said to you in 2014 and you're still deciding if they're 'safe'.",
    advice: "Not everyone is out to get you. Some people are just forgetful. Drink some water and put the shell down.",
  },
  Leo: {
    tagline: "Main character energy (even in the background).",
    roast: "You don't enter a room, you debut. Your self-esteem is so high it's technically a navigational hazard for low-flying aircraft. You think 'humility' is a brand of Italian leather shoes.",
    advice: "Let someone else hold the literal or metaphorical microphone for five minutes. It's okay, you're still pretty.",
  },
  Virgo: {
    tagline: "High-functioning anxiety with a spreadsheet.",
    roast: "You're the only person who can make a vacation feel like a performance review. You don't have 'hobbies,' you have 'systems for optimized personal development'.",
    advice: "The world won't end if there's a typo in your grocery list. I promise. Take a deep breath through your color-coded nose.",
  },
  Libra: {
    tagline: "Indecisive aesthetician.",
    roast: "You'd be the perfect diplomat if you could actually decide what to have for lunch. You're so busy 'seeing both sides' that you've effectively become a human swivel chair.",
    advice: "Flip a coin. If you hate the result, you'll finally know what you actually wanted. Also, you look great today, obviously.",
  },
  Scorpio: {
    tagline: "Intense mystery (mostly just brooding).",
    roast: "You have a 'black belt' in investigative journalism but only for your ex's new partner. Your trust issues are so advanced they've developed their own trust issues.",
    advice: "A secret isn't a personality trait. Try telling someone your favorite color without making it sound like a threat.",
  },
  Sagittarius: {
    tagline: "Tactless philosopher.",
    roast: "You're a 'truth-teller,' which is just code for 'I say whatever comes to my head regardless of who it hurts.' You're currently planning a trip to a country you can't pronounce to find a 'vibe' you already lost.",
    advice: "Check your bank account before booking the one-way flight. Real life is also a vibe, occasionally.",
  },
  Capricorn: {
    tagline: "CEO of your own misery.",
    roast: "You're three business suits in a trench coat pretending to have a soul. You measure your worth in LinkedIn connections and the amount of sleep you've successfully avoided.",
    advice: "Joy is not an 'inefficient use of resources.' Try doing something that doesn't have a ROI. Like a nap.",
  },
  Aquarius: {
    tagline: "Alien in a human suit.",
    roast: "You're so 'unique' that you've looped back around to being predictable. You love humanity as a concept but hate actual humans because they won't stop having 'feelings' at you.",
    advice: "Being contrarian isn't the same as being right. Sometimes the popular opinion is just... correct. It's rare, but it happens.",
  },
  Pisces: {
    tagline: "Daydreaming aquatic sponge.",
    roast: "You're essentially just a collection of other people's moods held together by expensive incense. You've 'manifested' a lot of things, but a stable sleep schedule isn't one of them.",
    advice: "Grounding. Try it. Touch some actual grass that isn't in a digital dreamscape. Boundaries are your friend, not your enemy.",
  },
};

export function getZodiacRoast(sign: string): ZodiacRoast {
  const normalizedSign = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
  const roastData = ROASTS[normalizedSign] || ROASTS.Aries;
  return {
    sign: normalizedSign,
    ...roastData,
  };
}
