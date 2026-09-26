import { MINOR_NOTES, MINOR_REVERSED_NOTES } from './minor-content.js';

// Curated reflections on the complete tarot deck. These are written card meanings,
// not predictions or an interpretation generated from a visitor's question.
export const CARD_NOTES = {
  ...MINOR_NOTES,
  0: {
    meaning: "The Fool opens a conversation about beginnings: the moment before experience gives you a familiar route. Read this card as permission to be curious, while keeping your judgement close. You do not need to know the whole journey to notice the next useful step. Consider where preparation is helping, and where it has become a way to postpone trying. A beginning can be modest. Give an idea enough room to meet the real world, without asking your first attempt to prove everything.",
    prompt: "What small beginning would let you learn something you cannot learn by waiting?",
    practice: "Choose one reversible step, and write down what you hope to learn from it.",
    learn: "The Fool is numbered zero: an opening before the numbered journey of the Major Arcana. Its themes of curiosity and inexperience belong together. In a reading, it can help you examine the space between openness and carelessness, without treating either confidence or uncertainty as a guarantee."
  },
  1: {
    meaning: "The Magician brings attention to the relationship between an intention and the tools that can give it form. Rather than waiting to feel completely ready, take inventory of what is already available: a skill, a conversation, an hour, a place to begin. This card can also raise a useful question about focus. Which part of your effort produces something tangible, and which part only keeps you busy? Bring your attention to one clear task, small enough to complete and meaningful enough to build upon.",
    prompt: "Which resource already within reach could help you take your next step?",
    practice: "List three resources you can use, then connect one of them to a specific task.",
    learn: "The Magician's traditional table holds the four suit symbols: wand, cup, sword, and pentacle. Together they offer a vocabulary for action, feeling, thought, and material circumstances. The card invites you to consider how these different resources can work together, rather than relying on a single strength."
  },
  2: {
    meaning: "The High Priestess invites a quieter kind of attention. Before adding another opinion, allow yourself to notice what remains unfinished or difficult to name. A feeling can be valuable information without being the whole explanation. Bring it alongside what you can observe, and leave room for questions you cannot yet answer. This card offers a pause for listening rather than a demand for certainty. Consider what becomes easier to hear when you no longer feel obliged to explain it immediately to someone else.",
    prompt: "What are you noticing that you have not yet found words for?",
    practice: "Write for five minutes without resolving the question; underline one observation you want to understand better.",
    learn: "The High Priestess is associated with intuition, mystery, and knowledge that is only partly revealed. Her position between contrasting pillars gives these themes a visual form. In reflective practice, the card creates room for ambiguity and inward attention while leaving practical evidence and unanswered questions in view."
  },
  3: {
    meaning: "The Empress turns attention toward the conditions that allow something to grow. Care is more than enthusiasm at the beginning; it may be time, nourishment, a welcoming space, or a patient return. Consider what you are making or tending, and whether the way you support it is sustainable for you as well. This card also gives pleasure a place in the conversation. Notice the ordinary things that restore interest and warmth. Growth need not be forced to be worth taking seriously.",
    prompt: "What would help something you care about grow without exhausting you?",
    practice: "Choose one small act of care that you can offer consistently, including care for yourself.",
    learn: "The Empress gathers themes of nurture, creativity, nature, and abundance. These can describe the process of making and sustaining something, rather than a promise of material reward. Reading the card through the idea of cultivation helps distinguish generous care from the pressure to provide endlessly."
  },
  4: {
    meaning: "The Emperor offers a way to examine structure: the agreements, boundaries, and routines that hold a situation together. Useful structure makes action easier and responsibility clearer. It does not need to control every detail. Consider where a firmer boundary might protect your attention, or where an old rule now limits what it once supported. The question is less about appearing certain than about being dependable. Choose an arrangement that you can explain, uphold fairly, and revise when circumstances genuinely change.",
    prompt: "Which boundary or agreement would make your situation clearer?",
    practice: "Write one clear boundary in plain language, including what it protects and how you will maintain it.",
    learn: "The Emperor's themes are authority, stability, and structure. A throne of stone makes endurance visible, but also suggests the possible weight of rigidity. In a reading, this contrast can help you evaluate whether a rule creates security, concentrates control, or needs to become more flexible."
  },
  5: {
    meaning: "The Hierophant asks what you have learned from the people and traditions around you. Some inherited practices provide a useful foundation; others deserve to be examined before they shape another decision. You can value guidance without handing over your judgement. Consider who has earned your trust through clarity, experience, and the freedom they give you to ask questions. This card makes room for learning with others, and for choosing deliberately which parts of a tradition you want to carry forward.",
    prompt: "Which inherited belief still supports you, and which one needs another look?",
    practice: "Choose one rule you tend to follow and write why you want to keep, adapt, or question it.",
    learn: "The Hierophant brings together teaching, tradition, institutions, and shared practice. Its symbolism concerns how knowledge is passed between people. It can invite respect for experience while also making conformity visible: a useful distinction when deciding whether guidance helps you understand or simply tells you to obey."
  },
  6: {
    meaning: "The Lovers places choice beside connection. It can speak to a relationship, but it also asks whether an action expresses what matters to you. Consider the values beneath the options, rather than only their immediate appeal. Where other people are involved, leave room for their perspective and their freedom to choose. Alignment does not mean that every desire agrees or every choice is effortless. It means understanding what you are saying yes to, what it asks of you, and why.",
    prompt: "Which choice would express a value you want to live by?",
    practice: "Name your two most important values in this situation, then compare your options against them.",
    learn: "The Lovers is associated with union, choice, and alignment. Its two figures make relationship visible, while its broader meaning extends beyond romance. In a reading, it can help you explore how connection and individual responsibility coexist, without claiming to reveal another person's thoughts or intentions."
  },
  7: {
    meaning: "The Chariot brings direction into focus. When several demands pull at once, effort alone may not move you toward what matters. Consider which aim deserves priority and what would help you recognise progress. Determination can include restraint: declining a distraction, setting a manageable pace, or adjusting the route when new information appears. This card invites you to take responsibility for your part of the movement. You can choose a direction without pretending that every obstacle or other person's response is yours to control.",
    prompt: "What would progress look like if you committed to one direction?",
    practice: "Define one achievable milestone and set aside one competing task until you reach it.",
    learn: "The Chariot's contrasting pulling figures express a tension between different forces. The card connects willpower with direction, asking how those forces are brought into coordination. As a reflective symbol, it is useful for distinguishing purposeful movement from speed, pressure, or the need to appear in control."
  },
  8: {
    meaning: "Strength considers the kind of courage that allows you to stay present without becoming harsh. It may help to distinguish a strong feeling from the action you choose in response. Patience is active when it gives you time to respond with care and a clear boundary. This card does not ask for endless tolerance or for difficult feelings to disappear. It invites a steadier relationship with them, so that firmness and compassion can both have a place in what you do next.",
    prompt: "Where could you be both kinder and clearer?",
    practice: "Draft a response to a difficult situation that includes one honest feeling and one clear boundary.",
    learn: "Strength traditionally pairs a human figure with a lion. This relationship gives form to courage, patience, and the handling of powerful impulses. The image can be read as an encounter rather than a conquest: a way to consider how gentleness and firmness might work together."
  },
  9: {
    meaning: "The Hermit makes room for an answer that develops slowly. Step back from the demand to decide or explain, and notice which parts of the question are truly yours. Reflection can help separate a personal value from the volume of other people's opinions. Solitude is useful when it brings you back with greater clarity; it need not become isolation. Consider what you want to understand before your next conversation, and what you might still need to learn from someone else.",
    prompt: "What do you want to understand for yourself before seeking another opinion?",
    practice: "Take ten quiet minutes to write your own view, then note one question worth discussing with someone you trust.",
    learn: "The Hermit's lantern gives introspection a visible form: a small light carried through a larger darkness. Its symbolism invites reflection, solitude, and the careful sharing of wisdom. It does not require complete withdrawal; the contrast between private understanding and renewed participation is part of its usefulness."
  },
  10: {
    meaning: "The Wheel of Fortune offers a way to think about change without making every change a personal verdict. Circumstances shift, familiar patterns return, and your influence has limits. Consider what is moving around you and what response remains available. There may be something to learn from recognising a cycle, especially if you usually notice it only afterward. The card does not promise a favourable turn. It invites flexibility, attention to timing, and a clearer distinction between preparation and attempts to control an uncertain outcome.",
    prompt: "What is changing around you, and which part of your response can you choose?",
    practice: "Make two short lists: what you can influence and what you need to observe or adapt to.",
    learn: "A turning wheel gathers the themes of cycles, changing circumstances, and chance into one image. The same position cannot remain at the top forever. In reflection, this can loosen the assumption that a present condition is permanent, while avoiding the claim that a specific change is guaranteed."
  },
  11: {
    meaning: "Justice asks you to slow down enough to examine a situation fairly. What do you know, what are you assuming, and whose perspective is missing? An honest account can include your own responsibility without making you responsible for everything. Consider whether the standard you apply to another person is also one you would accept for yourself. This card invites clarity about choices and their effects. A measured response may begin with checking a fact, acknowledging an impact, or naming a question that remains unresolved.",
    prompt: "What would a fair account of this situation need to include?",
    practice: "Separate observations from assumptions on paper, and identify one fact you can check.",
    learn: "Justice holds scales and a sword: images of weighing and discernment. Its themes of truth, responsibility, and consequences make it useful for examining a decision. The card is a reflective symbol, not a verdict, and it cannot establish facts about a dispute or predict its outcome."
  },
  12: {
    meaning: "The Hanged Man invites you to change your vantage point before repeating the same effort. A pause can create room to notice an assumption that urgency keeps hidden. Consider what happens if you temporarily set aside the outcome you have been insisting on. What other interpretation becomes possible? Waiting is not automatically useful, and sacrifice is not automatically meaningful. Let this card help you distinguish an intentional pause from a delay that has lost its purpose, then decide what would make the pause worthwhile.",
    prompt: "What might you see if you set aside your preferred outcome for a moment?",
    practice: "Describe the situation from one other perspective, then set a time to return to your decision.",
    learn: "The Hanged Man's inverted position makes a changed perspective literal. The card connects suspension with surrender and reconsideration. Used reflectively, it can help examine the difference between making space for insight and remaining indefinitely in a situation simply because stopping or changing course feels difficult."
  },
  13: {
    meaning: "Death is a symbolic card of endings and transition, not a prediction of physical death. It asks you to consider what has reached a limit, or what you no longer want to carry in its current form. An ending can contain grief, relief, uncertainty, or several feelings at once. You do not have to make it beautiful or rush toward a replacement. Look for a respectful way to acknowledge change, while leaving space to decide what should be preserved and what can be released.",
    prompt: "What would you like to stop carrying in the same way?",
    practice: "Write down one thing to release and one thing you want to preserve through a change.",
    learn: "Death belongs to the Major Arcana's language of transformation. Its imagery places endings beside the possibility of renewed life. In a reflective reading, it concerns change in patterns, roles, or attachments; treating it as a literal forecast would mistake a symbolic image for factual knowledge."
  },
  14: {
    meaning: "Temperance brings attention to proportion. When two needs seem opposed, a workable response may come through adjustment rather than choosing one and neglecting the other. Consider the pace, quantity, or arrangement that would allow both to be acknowledged. Balance is something you can revisit as conditions change; it does not have to become another standard you must meet perfectly. This card favours patient experimentation. Try a small alteration, observe how it feels in practice, and leave yourself room to refine it.",
    prompt: "What small adjustment could make two competing needs easier to hold together?",
    practice: "Choose one daily arrangement to adjust for a week, then review what became easier or harder.",
    learn: "Temperance is often shown pouring between two cups, with one foot on land and one in water. These relationships give balance and combination a physical form. The card can help you consider proportion as an ongoing practice, rather than a fixed midpoint that suits every circumstance."
  },
  15: {
    meaning: "The Devil invites a clear look at attachment: what draws your attention, what it offers, and what it costs. A familiar pattern can be difficult to question even when part of it no longer serves you. Begin with description rather than blame. Some limits are real, and recognising them matters as much as recognising a choice. This card can help you locate one part of a pattern that is available to change, or one source of support that would make change more possible.",
    prompt: "What does a familiar pattern give you, and what does it ask in return?",
    practice: "Describe one repeated pattern without judging yourself, then identify a small change or useful source of support.",
    learn: "The Devil uses the image of binding to explore attachment, habit, and the experience of constraint. That symbolism can make a pattern easier to examine, but it should not erase real limitations or assign blame. Its reflective value lies in careful observation and the possibility of increased agency."
  },
  16: {
    meaning: "The Tower raises a question about foundations: which assumptions are supporting the way you see a situation? A new fact or unexpected change can make an old explanation less convincing. You need not treat disruption as deserved, necessary, or secretly beneficial. Instead, consider what remains reliable and what now needs another look. This card is an invitation to examine, not a warning that disaster is coming. Start with something concrete enough to verify, and let your next understanding be built from what you actually know.",
    prompt: "Which assumption would be most useful to check before you build on it?",
    practice: "Name one assumption, the evidence supporting it, and what information could change your view.",
    learn: "The Tower's dramatic imagery connects sudden change with the failure of an established structure. As a symbol, it can make assumptions and instability visible. It does not predict an event or explain why hardship happens; its usefulness is in examining foundations and identifying what remains dependable."
  },
  17: {
    meaning: "The Star turns toward renewal without requiring you to feel hopeful on command. Consider what restores a little openness: a place, a practice, a person, or an idea that still matters to you. A quieter form of confidence may grow through repeated care rather than a sudden change of feeling. This card invites you to notice what is sustaining, however modest it seems. You do not need proof that everything will work out to make room for one thing worth tending today.",
    prompt: "What restores a small sense of possibility for you?",
    practice: "Make time for one familiar source of renewal, then note what you notice afterward.",
    learn: "The Star joins the image of distant light with water being poured onto land and into a pool. Its themes include hope, renewal, and generosity. A reflective reading can draw on these themes without making promises: attending to what nourishes possibility is different from knowing the future."
  },
  18: {
    meaning: "The Moon offers space for what is uncertain. When details are missing, imagination can supply an explanation that feels convincing before it is supported. Notice the difference between what you observe, what you feel, and what you suspect. Each deserves attention, but they need not be treated as the same kind of information. This card invites patience with an unfinished picture. Consider what would bring useful clarity, and what you can allow to remain unresolved while you gather it.",
    prompt: "What do you know, and what are you filling in because the picture is incomplete?",
    practice: "Write three brief lines: what I observed, what I feel, and what I still need to find out.",
    learn: "The Moon's changing light connects uncertainty with imagination and intuition. Its imagery often includes a path between distant towers, suggesting a route through an unclear scene. In a reading, it can help distinguish impressions from evidence while allowing the symbolic and emotional parts of a question to remain present."
  },
  19: {
    meaning: "The Sun directs attention to what feels clear, enlivening, or worth appreciating. You can recognise something good without asking it to cancel the difficult parts of your life. Consider where effort has become visible, where you feel more at ease, or what you would like to share with someone else. This card offers a moment to acknowledge those things fully. Let enjoyment be specific: a completed task, an honest exchange, a simple pleasure. There is no need to turn it immediately into the next goal.",
    prompt: "What is going well that you have not yet allowed yourself to appreciate?",
    practice: "Record one specific thing you value about today, and give it a few minutes of undivided attention.",
    learn: "The Sun gathers themes of clarity, vitality, and joy. Its open, bright imagery contrasts with the Moon's uncertainty, offering a different quality of attention. Read reflectively, it encourages recognition of what is present and sustaining, without promising success or requiring a cheerful response to every circumstance."
  },
  20: {
    meaning: "Judgement asks for an honest review that leaves room for change. Looking back can help you understand a decision, a pattern, or a value more clearly; it need not become a case against yourself. Consider what you would recognise now that you could not see then. What deserves acknowledgement, repair, or another attempt? This card invites you to bring what you have learned into your next choice. Let the review be specific enough to be useful, and compassionate enough that you can remain open to it.",
    prompt: "What has experience taught you that you want your next choice to reflect?",
    practice: "Finish these two sentences: ‘I understand this differently now’ and ‘Next time, I would like to…’",
    learn: "Judgement uses a call to awakening as its central image. It connects reflection and reckoning with the possibility of responding differently. In a reading, this can become a constructive review of experience: recognising an impact or a lesson without treating your past as a final definition of who you are."
  },
  21: {
    meaning: "The World invites you to recognise what has come together. Completion may be a visible achievement, or simply a point at which you can see a larger pattern in what you have experienced. Consider what deserves to be acknowledged before you move straight into another task. If something remains unfinished, identify the actual loose end rather than demanding a feeling of perfect closure. This card gives integration a place: naming what you have learned, what you can carry forward, and what this particular chapter no longer needs from you.",
    prompt: "What deserves acknowledgement before you move into the next chapter?",
    practice: "Write a short closing note: what you completed, what you learned, and what you will carry forward.",
    learn: "The World's enclosing wreath gives completion a visible boundary, while the figure within it remains in motion. Its themes include integration and fulfilment. This combination can help you recognise an ending without imagining that growth stops there: one experience can be complete while life continues beyond it."
  }
};

// General intention prompts used alongside the card reference.
export const INTENTION_NOTES = {
  open: "Read the card with an open question: what deserves a little more of your attention today?",
  relationships: "Hold the card beside this question: what can you understand or express more clearly in your connections with others?",
  work: "Hold the card beside this question: where would your attention, effort, or creativity be most meaningfully placed?",
  change: "Hold the card beside this question: what would help you meet a change with greater understanding?"
};

export const SAMPLE = {
  question: "What deserves my attention while I consider a change?",
  cardId: 9,
  interpretation: "The Hermit offers a pause before another opinion or another plan. Beside this question, its invitation is to separate what you want from what feels expected of you. Try naming the part of the change that matters personally, then the part you still need to understand. Reflection need not produce a complete answer. It can give your next conversation a clearer starting point.",
  prompt: "If nobody else needed an explanation yet, what would you want to understand first?",
  reflection: "I want to know whether I am moving toward something I value, or simply away from something familiar.",
  label: "An illustrative reading · The Hermit"
};

// Reversals are optional reflective angles, never a declaration of bad luck.
export const REVERSED_NOTES = {
  ...MINOR_REVERSED_NOTES,
  0: {"meaning": "The Fool reversed draws attention to a beginning that needs more care, or caution that has become a reason never to start. Separate the preparation that reduces a real risk from the reassurance you could keep seeking forever. A small experiment can respect uncertainty without ignoring it.", "prompt": "What would make a first step careful enough to try?", "practice": "Name one risk, one precaution, and one reversible first step."},
  1: {"meaning": "The Magician reversed draws attention to effort that is scattered, underused, or directed toward appearances. Notice where your abilities produce real value and where they only make you look busy. You may need a clearer intention, a smaller scope, or an honest account of what support is missing.", "prompt": "Which activity uses your abilities without moving the question forward?", "practice": "Choose one useful outcome and stop one activity that distracts from it."},
  2: {"meaning": "The High Priestess reversed draws attention to a quiet impression that is being dismissed, or given more authority than the evidence supports. Listen without treating a feeling as a verdict. Privacy can protect reflection, but silence can also leave an important question unasked.", "prompt": "What could you acknowledge privately and then check in the real world?", "practice": "Write one impression and one observation that might support or challenge it."},
  3: {"meaning": "The Empress reversed draws attention to care that has become depleted, intrusive, or difficult to receive. Growth may need space rather than more effort. Consider whether you are tending something sustainably and whether your own needs have a place in the arrangement.", "prompt": "Where could less pressure create better conditions for growth?", "practice": "Reduce one unnecessary demand and make room for an ordinary act of care."},
  4: {"meaning": "The Emperor reversed draws attention to a structure that is too rigid, unreliable, or difficult to question. Examine what a rule protects and what it prevents. Dependability can include flexibility; a boundary is more useful when its purpose and responsibilities are clear.", "prompt": "Which rule needs a clearer purpose or a fairer boundary?", "practice": "Rewrite one agreement so that it names both a limit and a responsibility."},
  5: {"meaning": "The Hierophant reversed draws attention to an inherited rule that no longer fits, or rejection of guidance before its value is understood. You can question a tradition without dismissing every source of experience. Look for teaching that welcomes questions and leaves your judgement intact.", "prompt": "What would you keep if you chose this belief again for yourself?", "practice": "Compare one inherited rule with the reason you would accept or change it today."},
  6: {"meaning": "The Lovers reversed draws attention to a gap between what matters to you and what a choice asks of you. Conflicting values deserve to be named rather than concealed by the wish for a perfect answer. In relationships, consider your own choices without claiming to know another person’s private feelings.", "prompt": "What compromise would conflict with a value you want to protect?", "practice": "Name a value, a trade-off, and one honest conversation the choice needs."},
  7: {"meaning": "The Chariot reversed draws attention to motion without a clear direction, or control that costs more than it achieves. A slower pace may make coordination possible. Distinguish what you can influence from the responses and conditions that are not yours to command.", "prompt": "What could you stop pushing long enough to choose a direction?", "practice": "Set one achievable milestone and remove one competing demand."},
  8: {"meaning": "Strength reversed draws attention to self-doubt, suppressed feeling, or pressure to endure beyond a useful limit. A strong response can include asking for help, stepping back, or naming a boundary. Gentleness need not mean accepting every demand.", "prompt": "What would strength look like without forcing yourself through this?", "practice": "Write one kind but firm limit you can put into practice."},
  9: {"meaning": "The Hermit reversed draws attention to reflection that has become isolation, or noise that makes your own view difficult to hear. Consider whether you need a quieter moment or a trusted conversation. The point of a retreat is to return with understanding, not to make withdrawal another obligation.", "prompt": "Would solitude or a carefully chosen conversation help more now?", "practice": "Set aside a short period to reflect, then choose how to reconnect."},
  10: {"meaning": "Wheel of Fortune reversed draws attention to resistance to change or a recurring response that keeps the same difficulty in place. Not every circumstance is controllable. Look for the part of the pattern you can describe and the response that remains available to you.", "prompt": "What repeats, and which part of your response could change?", "practice": "Separate what you can influence, what you can prepare for, and what you cannot control."},
  11: {"meaning": "Justice reversed draws attention to an uneven account of responsibility or a conclusion reached before the facts are clear. Check whether the same standards are being applied fairly. You can acknowledge your part without accepting responsibility for everything.", "prompt": "What evidence or perspective is missing from your current account?", "practice": "Write what is known, what is assumed, and one question that needs an answer."},
  12: {"meaning": "The Hanged Man reversed draws attention to a pause that has lost its purpose, or resistance to seeing the question differently. Waiting can be useful when you know what you are waiting to learn. Consider the cost of staying still and whether a small experiment could offer another view.", "prompt": "What would tell you that this pause has done its work?", "practice": "Set a review point and name the information you want before it."},
  13: {"meaning": "Death reversed draws attention to an ending that is difficult to acknowledge or change being forced before you are ready. This is symbolic change, not a forecast of death. Notice what can be released gradually and what deserves to be preserved through the transition.", "prompt": "What part of the old arrangement are you trying to keep unchanged?", "practice": "Name one thing to carry forward and one thing to let change in a manageable way."},
  14: {"meaning": "Temperance reversed draws attention to an arrangement whose pace or proportions no longer feel workable. Balance does not require giving every demand an equal share. Start with one adjustment you can observe rather than trying to correct everything at once.", "prompt": "Which small adjustment would relieve the greatest strain?", "practice": "Change one proportion or routine, then choose when to review its effect."},
  15: {"meaning": "The Devil reversed draws attention to a binding pattern you are beginning to question, or freedom that still feels difficult to use. Avoid replacing the pattern with self-blame. Name both its appeal and its cost, including any real limitations that make change harder.", "prompt": "Where is one realistic choice or source of support becoming visible?", "practice": "Describe one pattern plainly and choose a manageable interruption or request for help."},
  16: {"meaning": "The Tower reversed draws attention to an assumption you may be protecting from scrutiny, or the work of rebuilding after disruption. This does not predict catastrophe. Check what remains dependable before making another decision on a foundation that may need repair.", "prompt": "Which assumption needs checking, and what is still reliable?", "practice": "Verify one important claim and identify one dependable resource."},
  17: {"meaning": "The Star reversed draws attention to hope that feels distant, forced, or dependent on an immediate result. You do not need to perform optimism. A small reliable source of care may matter more than convincing yourself that everything will work out.", "prompt": "What could sustain you without asking you to feel hopeful first?", "practice": "Return to one modest source of renewal and notice its effect."},
  18: {"meaning": "The Moon reversed draws attention to uncertainty beginning to clear, or a compelling story that still needs checking. A new explanation can feel relieving before it is well supported. Give feelings room while distinguishing them from what you have actually observed.", "prompt": "Which part of the picture is clearer, and which remains an assumption?", "practice": "Write what you know now, what you still do not know, and how to check one point."},
  19: {"meaning": "The Sun reversed draws attention to enjoyment that is muted, delayed, or obscured by pressure to feel positive. Something worthwhile can be present alongside difficulty. Let appreciation be specific and private if it needs to be; you do not owe anyone a cheerful performance.", "prompt": "What good thing could you acknowledge without pretending everything is easy?", "practice": "Make room for one simple pleasure or one specific achievement."},
  20: {"meaning": "Judgement reversed draws attention to a review that has become self-criticism, or a lesson you are reluctant to act on. Responsibility is more useful when it leads to a different response. Distinguish what deserves repair from a label you keep placing on yourself.", "prompt": "What lesson could change an action rather than become a judgement of you?", "practice": "Write one thing you understand differently and one response you want to practise."},
  21: {"meaning": "The World reversed draws attention to a loose end, delayed recognition, or pressure to feel completely finished. A chapter can be substantially complete without giving you perfect closure. Identify what genuinely remains to do and what simply needs acknowledgement.", "prompt": "Is there an actual loose end, or a feeling of completion you are waiting for?", "practice": "Name one finishing action and one thing the experience has already taught you."}
};

export function cardNotesForOrientation(cardId, orientation = 'upright') {
  if (!Object.hasOwn(CARD_NOTES, cardId)) throw new TypeError('Choose a tarot card from 0 to 77.');
  if (orientation !== 'upright' && orientation !== 'reversed') throw new TypeError('Choose a valid card orientation.');
  return orientation === 'reversed' ? { ...CARD_NOTES[cardId], ...REVERSED_NOTES[cardId] } : CARD_NOTES[cardId];
}
