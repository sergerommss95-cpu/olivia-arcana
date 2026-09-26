// Authored Minor Arcana reflections. Stable IDs follow Wands, Cups, Swords,
// Pentacles, each ordered Ace–Ten, Page, Knight, Queen, King. Court cards
// describe qualities to explore, not a person's gender or a predicted visitor.
const entries = [
  {
    id: 22, name: 'Ace of Wands', group: 'movement',
    theme: 'giving a fresh impulse somewhere to begin',
    gift: 'enthusiasm that can become a first experiment',
    friction: 'mistaking the excitement of an idea for a commitment to it',
    release: 'the demand to know where a spark will lead',
    action: 'give an idea twenty minutes of practical attention before evaluating its future',
    question: 'Which idea makes you want to try something with your own hands?',
    meaning: 'The Ace of Wands attends to the first spark of interest: the desire to make, explore, or begin. Enthusiasm is useful before it becomes a complete plan. Give it a small, real task. Notice whether working with the idea deepens your interest, and what support that interest would need to continue.',
    learn: 'Wands connect to energy, initiative, and creative effort. Their Ace concentrates that potential into a beginning; it does not promise a particular result.'
  },
  {
    id: 23, name: 'Two of Wands', group: 'reflection',
    theme: 'considering a wider horizon from your present position',
    gift: 'perspective that connects ambition with a considered plan',
    friction: 'planning an imagined future without testing its assumptions',
    release: 'the expectation that considering an option commits you to it',
    action: 'compare two possible directions and identify one fact you need about each',
    question: 'What would you want to know before taking an idea beyond familiar ground?',
    meaning: 'The Two of Wands pauses between having an idea and extending yourself toward it. Look beyond what is familiar, then return to the resources and responsibilities you actually have. A larger view can help you choose deliberately. You can explore a direction without promising to follow it all the way.',
    learn: 'A figure surveying a distant landscape expresses planning and possibility. The card distinguishes a wider view from the practical work of setting out.'
  },
  {
    id: 24, name: 'Three of Wands', group: 'transition',
    theme: 'watching what develops after an initial effort',
    gift: 'foresight and a willingness to work beyond familiar boundaries',
    friction: 'waiting for a response without deciding what to do meanwhile',
    release: 'the need to know the whole outcome before preparing your next move',
    action: 'review an effort already under way and prepare for two plausible responses',
    question: 'What can you prepare while the results of an earlier step are still forming?',
    meaning: 'The Three of Wands turns toward the space an earlier action has opened. Something may now depend on responses, timing, or conditions beyond your reach. Use the interval to observe and prepare. Consider which connections would broaden your understanding, and how your plan could adapt without losing its purpose.',
    learn: 'The traditional view across water connects this card with expansion and anticipation. Its reflective emphasis is on preparation after action, rather than guaranteed success.'
  },
  {
    id: 25, name: 'Four of Wands', group: 'connection',
    theme: 'making space to acknowledge a shared milestone',
    gift: 'belonging built through welcome and shared celebration',
    friction: 'organising an occasion while overlooking whether people feel included',
    release: 'the belief that a milestone needs to be impressive to deserve recognition',
    action: 'mark a small achievement with someone who helped make it possible',
    question: 'What would make a moment of celebration feel welcoming rather than performative?',
    meaning: 'The Four of Wands gives recognition a place in the work. A milestone can deserve a pause even when more remains unfinished. Think about the people and conditions that made it possible. A modest gathering, a thank-you, or a familiar ritual can make belonging tangible without requiring a perfect occasion.',
    learn: 'Four decorated wands often form a welcoming threshold. The image brings together celebration, a shared foundation, and the experience of being received.'
  },
  {
    id: 26, name: 'Five of Wands', group: 'structure',
    theme: 'finding a workable shape for competing energies',
    gift: 'different perspectives that can sharpen an idea',
    friction: 'competition continuing after its purpose has become unclear',
    release: 'the assumption that every disagreement needs a winner',
    action: 'name the shared task and agree on one useful rule for discussing differences',
    question: 'Are you disagreeing about the aim, the method, or the wish to be heard?',
    meaning: 'The Five of Wands brings several efforts into the same space. Friction can reveal useful differences, but it can also consume attention without moving anything forward. Clarify what people are trying to accomplish and how each voice can be heard. You need not treat every challenge as an attack or every contest as necessary.',
    learn: 'The crossing wands suggest contention, practice, or competing contributions. The card invites examination of how differences are organised, rather than assuming conflict is inevitable.'
  },
  {
    id: 27, name: 'Six of Wands', group: 'movement',
    theme: 'receiving recognition without losing sight of the work',
    gift: 'confidence supported by a specific achievement',
    friction: 'allowing approval to become the only measure of progress',
    release: 'the obligation to keep proving yourself after a success',
    action: 'acknowledge one achievement and name the help that contributed to it',
    question: 'Which part of your progress matters even when nobody is watching?',
    meaning: 'The Six of Wands allows a good result to be seen. Receive appreciation without immediately shrinking it or turning it into the next demand. Then consider what the achievement means to you beyond public approval. Confidence becomes more dependable when it rests on specific effort, learning, and the contributions of others.',
    learn: 'The laurel wreath traditionally signals recognition. Read reflectively, it opens questions about confidence, visibility, shared credit, and dependence on an audience.'
  },
  {
    id: 28, name: 'Seven of Wands', group: 'structure',
    theme: 'choosing what is worth standing for',
    gift: 'a clear boundary around a position that matters',
    friction: 'responding to every challenge as if something essential is at stake',
    release: 'the need to defend every preference with equal force',
    action: 'identify one principle to uphold and one disagreement you can leave alone',
    question: 'What are you protecting, and does your response serve that purpose?',
    meaning: 'The Seven of Wands examines the effort of maintaining a position under pressure. Name what you are defending before deciding how firmly to respond. Some boundaries deserve a clear stand; some arguments do not deserve more of your time. Staying open to useful feedback need not mean abandoning what matters.',
    learn: 'A figure holding higher ground gives persistence and defence a visible form. The card can help distinguish purposeful boundaries from habitual opposition.'
  },
  {
    id: 29, name: 'Eight of Wands', group: 'movement',
    theme: 'responding clearly when several things begin to move',
    gift: 'momentum supported by timely communication',
    friction: 'speed carrying an unexamined assumption into the next action',
    release: 'the belief that a quick response must also be an immediate commitment',
    action: 'clarify the next message or handover before accelerating the work',
    question: 'What needs to be clear so that movement does not become confusion?',
    meaning: 'The Eight of Wands gathers attention around pace. Messages, decisions, or tasks can arrive close together, making clear priorities especially useful. Distinguish what truly needs a quick response from what needs a considered one. Momentum works better when people understand the direction and the next handover.',
    learn: 'Eight airborne wands create an image of coordinated movement. They suggest speed and communication as themes to examine, not a forecast of incoming news.'
  },
  {
    id: 30, name: 'Nine of Wands', group: 'structure',
    theme: 'protecting your capacity after sustained effort',
    gift: 'experience that helps you recognise a necessary boundary',
    friction: 'remaining on guard after the immediate pressure has passed',
    release: 'the expectation that resilience means never resting',
    action: 'set a clear stopping point and identify the support needed before continuing',
    question: 'What would help you continue without treating exhaustion as proof of commitment?',
    meaning: 'The Nine of Wands honours what sustained effort can teach, while asking about its cost. Experience may make you cautious, but constant vigilance also uses energy. Consider what protection is still useful and what recovery you need. Continuing, pausing, and asking for support are all decisions worth making deliberately.',
    learn: 'The watchful figure and standing wands connect perseverance with guardedness. Both the strength gained through experience and the burden of staying braced are present.'
  },
  {
    id: 31, name: 'Ten of Wands', group: 'structure',
    theme: 'reconsidering how responsibility is distributed',
    gift: 'an honest view of what your commitments require',
    friction: 'carrying tasks that no longer need to belong to you alone',
    release: 'the belief that being dependable means accepting every load',
    action: 'list your current responsibilities and renegotiate, delegate, or remove one',
    question: 'Which part of the load is necessary, and which part has become a habit?',
    meaning: 'The Ten of Wands makes the weight of accumulated responsibilities visible. Something worthwhile can still be too much in its current arrangement. Look at the whole load before blaming yourself for struggling with it. Clarify what must be done, what can wait, and what needs to be shared or renegotiated.',
    learn: 'The bundled wands obstruct their carrier’s view. This links responsibility and completion with the practical limits of doing too much at once.'
  },
  {
    id: 32, name: 'Page of Wands', group: 'movement',
    theme: 'approaching an unfamiliar interest as a learner',
    gift: 'playful curiosity and permission to be inexperienced',
    friction: 'abandoning an interest when the first awkward stage appears',
    release: 'the pressure to turn every curiosity into a finished identity',
    action: 'try one unfamiliar creative exercise without measuring it against expert work',
    question: 'What would you explore if you did not have to be good at it yet?',
    meaning: 'The Page of Wands brings the liveliness of encountering something for the first time. Follow a question far enough to discover what the activity actually feels like. You do not need to make a new interest into a career, a talent, or a permanent identity. Allow an exploratory attempt to remain an attempt.',
    learn: 'Pages often represent learning and early engagement with a suit’s qualities. This Page explores creative energy; it need not stand for a young person.'
  },
  {
    id: 33, name: 'Knight of Wands', group: 'movement',
    theme: 'directing bold energy toward a commitment you can sustain',
    gift: 'courage to act on a compelling possibility',
    friction: 'starting faster than you can follow through',
    release: 'the need for every worthwhile effort to feel exhilarating',
    action: 'pair an ambitious move with a realistic follow-through plan',
    question: 'What will support this intention when the first burst of excitement passes?',
    meaning: 'The Knight of Wands brings appetite for movement, adventure, and a visible leap into action. That energy can create a useful opening, but it needs somewhere to go afterward. Consider the commitments your enthusiasm is creating. A clear destination and a modest plan for returning to the work make boldness more useful.',
    learn: 'Knights express a suit through active pursuit. With Wands, that pursuit highlights initiative and intensity, alongside the possibility of restlessness.'
  },
  {
    id: 34, name: 'Queen of Wands', group: 'connection',
    theme: 'occupying your place with warmth and confidence',
    gift: 'self-possession that leaves room for other people to shine',
    friction: 'performing confidence instead of attending to your real energy',
    release: 'the need to make yourself smaller so others feel comfortable',
    action: 'express one preference plainly and make room for someone else to do the same',
    question: 'How would you participate if warmth and visibility could coexist?',
    meaning: 'The Queen of Wands explores a confidence that invites participation. You can bring warmth, humour, and conviction without needing to command every room. Notice where you conceal an interest or preference to avoid being seen. Equally, notice when performing vitality leaves little room for how you actually feel.',
    learn: 'The Queen of Wands is associated with warmth, confidence, and creative presence. These are qualities available to anyone, independent of age or gender.'
  },
  {
    id: 35, name: 'King of Wands', group: 'structure',
    theme: 'giving a larger vision responsible direction',
    gift: 'leadership that connects conviction with shared purpose',
    friction: 'expecting others to sustain a vision they had no part in shaping',
    release: 'the belief that leadership requires doing or deciding everything yourself',
    action: 'state the purpose of a project and invite others to shape how it is pursued',
    question: 'What would make your direction clear while leaving room for other people’s judgement?',
    meaning: 'The King of Wands considers how a strong vision becomes an undertaking others can trust. Make the purpose clear, then attend to the conditions in which people will carry it out. Conviction is more useful when it can listen. Taking responsibility includes giving others meaningful room to contribute and disagree.',
    learn: 'Kings often explore stewardship of a suit’s qualities. The King of Wands brings creative initiative into questions of leadership, direction, and responsibility.'
  },
  {
    id: 36, name: 'Ace of Cups', group: 'connection',
    theme: 'making room for a feeling before deciding what it means',
    gift: 'emotional openness and the capacity to receive care',
    friction: 'asking a new feeling to explain an entire relationship',
    release: 'the expectation that receptivity requires certainty or immediate disclosure',
    action: 'notice one feeling and give it a form through words, music, or a quiet act of care',
    question: 'What feeling could you allow without rushing to act on it?',
    meaning: 'The Ace of Cups invites receptivity: a little room for affection, tenderness, creativity, or another feeling that is arriving. You do not have to explain it immediately or know where it will lead. Notice how you receive as well as offer care. Let the feeling exist alongside your judgement and your boundaries.',
    learn: 'Cups traditionally concern emotional life and relationship. The overflowing Ace gives form to receptivity and feeling, without promising romance or another person’s response.'
  },
  {
    id: 37, name: 'Two of Cups', group: 'connection',
    theme: 'meeting another person through mutual attention',
    gift: 'reciprocity built through listening and honest exchange',
    friction: 'assuming agreement before each person has spoken',
    release: 'the expectation that connection means wanting exactly the same things',
    action: 'share one need and ask about the other person’s experience without supplying their answer',
    question: 'What would a more mutual exchange look like in this relationship?',
    meaning: 'The Two of Cups places two perspectives in relation. Connection grows through the exchange itself: speaking, listening, and checking what has been understood. Look at the balance between giving and receiving rather than assuming closeness means agreement. The card cannot tell you someone else’s feelings; a conversation can help you learn more.',
    learn: 'Two figures exchanging cups express mutual recognition. The theme extends beyond romance to friendship, collaboration, and any relationship where reciprocity matters.'
  },
  {
    id: 38, name: 'Three of Cups', group: 'connection',
    theme: 'finding nourishment in friendship and shared experience',
    gift: 'companionship that makes joy and difficulty easier to share',
    friction: 'going along with a group while leaving your own needs unspoken',
    release: 'the belief that you must earn company by being entertaining or useful',
    action: 'reach out to someone whose company allows you to feel more like yourself',
    question: 'Who helps you feel included without asking you to perform?',
    meaning: 'The Three of Cups brings attention to the people with whom experience becomes shareable. Friendship may offer celebration, practical help, or simply company that asks little of you. Notice where you feel welcomed and where belonging depends on hiding something. Make room for mutual support as well as a pleasant occasion.',
    learn: 'The raised cups of a small gathering connect this card with friendship, celebration, and community. It asks how shared feeling becomes supportive.'
  },
  {
    id: 39, name: 'Four of Cups', group: 'reflection',
    theme: 'understanding what lies beneath disengagement',
    gift: 'a pause that helps you distinguish disinterest from depletion',
    friction: 'rejecting an offer before noticing what you actually need',
    release: 'the demand to feel grateful or interested on command',
    action: 'name what feels flat and consider whether you need rest, a change, or a different kind of support',
    question: 'Is your lack of interest asking for rest, a boundary, or another possibility?',
    meaning: 'The Four of Cups considers a moment when available choices do not feel inviting. That response deserves curiosity, not an accusation of ingratitude. You may need rest, a more fitting offer, or time to understand what has changed. Before accepting or refusing, give the absence of interest a little attention.',
    learn: 'A seated figure appears apart from an offered cup. The image can suggest contemplation, dissatisfaction, or withdrawal; context matters more than a fixed verdict.'
  },
  {
    id: 40, name: 'Five of Cups', group: 'transition',
    theme: 'acknowledging disappointment while noticing what remains',
    gift: 'honesty about loss without making it the whole picture',
    friction: 'pressuring yourself to find a positive lesson before a loss has been felt',
    release: 'the demand to be finished with disappointment on a schedule',
    action: 'name what you miss and one source of support that is still available',
    question: 'What needs acknowledgement before you can turn toward what remains?',
    meaning: 'The Five of Cups gives disappointment room to be real. Something can matter precisely because its loss hurts. There is no need to replace that feeling with gratitude. When you are ready, widen your attention a little: what remains present, and who or what could support you without asking you to move on too quickly?',
    learn: 'Spilled cups sit alongside cups still standing. The contrast connects grief with remaining support, without suggesting that what remains cancels what was lost.'
  },
  {
    id: 41, name: 'Six of Cups', group: 'reflection',
    theme: 'revisiting the past with tenderness and perspective',
    gift: 'familiar sources of kindness, play, and belonging',
    friction: 'remembering comfort while leaving out the complexity of the past',
    release: 'the expectation that something meaningful must be recreated exactly',
    action: 'bring one valued quality from a good memory into your present day',
    question: 'What quality from the past would you like to carry forward in a new form?',
    meaning: 'The Six of Cups turns toward memory and the simple gestures through which care is learned. A remembered pleasure can tell you something about what still nourishes you. Let affection coexist with an honest account of what was difficult. You can preserve a quality of the past without trying to live inside it again.',
    learn: 'The exchange of flower-filled cups links this card with memory, generosity, and childhood. Reflection can recover a valued quality while questioning nostalgia.'
  },
  {
    id: 42, name: 'Seven of Cups', group: 'reflection',
    theme: 'giving imagined possibilities a reality check',
    gift: 'imagination that can produce more than one option',
    friction: 'comparing fantasies with the ordinary limitations of real choices',
    release: 'the wish to keep every possibility open indefinitely',
    action: 'choose two appealing options and check one practical detail about each',
    question: 'Which possibility still appeals when you include its ordinary demands?',
    meaning: 'The Seven of Cups opens a field of appealing, unsettling, or incomplete possibilities. Imagination can reveal desire, but it cannot supply all the facts a choice needs. Give the options names and distinguish an actual offer from an imagined one. Testing a few details may be more useful than inventing another possibility.',
    learn: 'The varied contents of seven cups evoke dreams, temptation, and alternatives. The card explores the relationship between imagining a choice and understanding it.'
  },
  {
    id: 43, name: 'Eight of Cups', group: 'transition',
    theme: 'recognising when an investment no longer feels sustaining',
    gift: 'honesty about needs that an existing arrangement does not meet',
    friction: 'staying only because you have already given something so much',
    release: 'the belief that changing direction erases the value of earlier effort',
    action: 'identify what is missing and consider whether it can be discussed, changed, or sought elsewhere',
    question: 'What would need to change for this to feel worth continuing?',
    meaning: 'The Eight of Cups asks about the difference between something being established and something being fulfilling. Take dissatisfaction seriously enough to understand it before making a decision. Perhaps an arrangement can change; perhaps a different direction deserves exploration. The card does not instruct you to leave. It invites an honest account of what is missing.',
    learn: 'A figure walking away from arranged cups gives dissatisfaction and searching a visual form. Departure is one symbolic possibility, not a prescribed action.'
  },
  {
    id: 44, name: 'Nine of Cups', group: 'connection',
    theme: 'recognising satisfaction on your own terms',
    gift: 'the capacity to enjoy something without immediately improving it',
    friction: 'confusing the appearance of satisfaction with your actual experience',
    release: 'the obligation to turn every pleasure into another achievement',
    action: 'make unhurried time for a pleasure you value for its own sake',
    question: 'What feels satisfying when you set aside how it looks to others?',
    meaning: 'The Nine of Cups asks what enough feels like for you. Enjoyment does not have to justify itself through productivity or applause. Notice a pleasure, comfort, or wish already present in some form. At the same time, leave room to admit when a polished picture of contentment does not match your experience.',
    learn: 'A seated figure before an array of cups suggests satisfaction and fulfilled desire. It is a prompt to examine contentment, not a guarantee that wishes come true.'
  },
  {
    id: 45, name: 'Ten of Cups', group: 'connection',
    theme: 'cultivating belonging within real relationships',
    gift: 'shared care that allows people to feel at home',
    friction: 'holding a relationship against an image of perfect harmony',
    release: 'the expectation that a loving connection contains no disagreement',
    action: 'ask what helps the people close to you feel included and choose one response together',
    question: 'What makes belonging possible in your actual life, rather than in an ideal picture?',
    meaning: 'The Ten of Cups brings shared wellbeing into focus. Think of the relationships, chosen family, or community in which people can feel at home. Lasting connection has room for differences, repair, and changing needs. Look beyond the image of harmony toward the everyday practices that make care believable.',
    learn: 'The traditional family beneath a rainbow expresses an ideal of shared fulfilment. Its meaning can extend to chosen family and community, without prescribing a household form.'
  },
  {
    id: 46, name: 'Page of Cups', group: 'connection',
    theme: 'listening to an unexpected emotional or creative response',
    gift: 'sensitivity that remains curious rather than embarrassed',
    friction: 'dismissing a tender feeling because it seems awkward or impractical',
    release: 'the pressure to make every feeling sound polished',
    action: 'put an unexpected feeling into a few honest words or a small creative sketch',
    question: 'What surprised you emotionally, and what might it help you understand?',
    meaning: 'The Page of Cups welcomes the feeling or imaginative association you did not plan to have. It may be tender, playful, or difficult to express. Give it a little attention without turning it into a prediction or a demand. A rough sketch, a sentence, or a sincere question can be enough.',
    learn: 'The surprising fish in the Page’s cup makes imagination visible. This court card explores emotional curiosity and expression rather than identifying a particular person.'
  },
  {
    id: 47, name: 'Knight of Cups', group: 'movement',
    theme: 'bringing an ideal into a sincere gesture',
    gift: 'imagination and the courage to express what matters emotionally',
    friction: 'falling in love with a possibility before meeting its reality',
    release: 'the expectation that sincerity must arrive as a grand gesture',
    action: 'express an intention in a small concrete offer that leaves the other person free to respond',
    question: 'How could you express what matters without asking reality to match a perfect scene?',
    meaning: 'The Knight of Cups considers how feeling moves toward expression. An invitation, apology, or creative proposal can make an ideal tangible. Attend to what you are actually offering and what the other person has said. Sincerity becomes clearer when it leaves space for a response you have not already imagined.',
    learn: 'The Knight carries a cup as an offering. Emotional pursuit, idealism, and creative expression belong to its symbolism; it does not predict a romantic arrival.'
  },
  {
    id: 48, name: 'Queen of Cups', group: 'connection',
    theme: 'offering emotional attention without losing your own boundaries',
    gift: 'empathy that listens carefully and makes room for complexity',
    friction: 'taking responsibility for feelings that belong to someone else',
    release: 'the belief that caring requires absorbing another person’s experience',
    action: 'listen without rushing to fix, then name what support you can realistically offer',
    question: 'How can you remain caring while staying in contact with your own needs?',
    meaning: 'The Queen of Cups values careful listening, including listening to yourself. Sensitivity can help you notice nuance without telling you what another person privately feels. Let empathy ask questions. You can offer a receptive presence while keeping clear limits around what you can carry, interpret, or change.',
    learn: 'The Queen’s attention to a richly shaped cup evokes inward feeling and compassion. These qualities can be practised by anyone; they do not require self-erasure.'
  },
  {
    id: 49, name: 'King of Cups', group: 'structure',
    theme: 'remaining emotionally present while choosing a measured response',
    gift: 'steadiness that allows feeling and judgement to work together',
    friction: 'appearing calm by keeping every feeling inaccessible',
    release: 'the belief that composure means being unaffected',
    action: 'name the feeling beneath your response and choose a way to express it without escalation',
    question: 'What would emotional steadiness look like if it included honesty?',
    meaning: 'The King of Cups explores steadiness in the presence of strong feeling. A measured response need not hide what matters. Notice the emotion, give it language, and consider what action serves the situation. Calm becomes more trustworthy when it allows honest communication rather than requiring everyone to guess what lies beneath it.',
    learn: 'The King’s throne surrounded by water pairs emotional depth with stability. The card concerns a way of responding, not an absence of feeling.'
  },
  {
    id: 50, name: 'Ace of Swords', group: 'reflection',
    theme: 'finding a clear distinction within a tangled question',
    gift: 'precise language and a willingness to examine evidence',
    friction: 'treating the force of an insight as proof that it is correct',
    release: 'the need for a clear thought to answer every part of the problem',
    action: 'write the central question in one sentence and separate a known fact from an assumption',
    question: 'Which distinction would make this easier to think about?',
    meaning: 'The Ace of Swords asks for clarity rather than certainty. A useful distinction or a carefully phrased question can cut through confusion without resolving everything. Name what you mean, check the evidence, and notice what remains open. An insight becomes stronger when it can withstand revision.',
    learn: 'Swords concern thought, communication, and conflict. Their Ace concentrates discernment into a clear edge; precision can help, but an edge also requires care.'
  },
  {
    id: 51, name: 'Two of Swords', group: 'reflection',
    theme: 'understanding what keeps a decision suspended',
    gift: 'a pause that protects you from choosing under pressure',
    friction: 'keeping a decision still by avoiding relevant information',
    release: 'the expectation that a meaningful choice can have no cost',
    action: 'name the trade-off and identify one missing piece of information you can seek',
    question: 'What are you trying to protect by leaving this undecided?',
    meaning: 'The Two of Swords considers the work involved in holding a decision still. A pause can be protective when you need more information or less pressure. It can also postpone a trade-off that will remain difficult. Ask what would make the pause useful, and what would tell you it is time to reconsider.',
    learn: 'Crossed swords and a covered gaze express suspension and guarded attention. The image invites questions about indecision, competing considerations, and information kept at a distance.'
  },
  {
    id: 52, name: 'Three of Swords', group: 'connection',
    theme: 'giving painful truth a careful place in the conversation',
    gift: 'honesty that makes an emotional wound easier to name',
    friction: 'repeating a hurtful interpretation as if it were the only account',
    release: 'the pressure to explain away pain before receiving support',
    action: 'describe what hurt in plain words and identify a supportive person or practice',
    question: 'What can you name honestly without turning the hurt into your whole story?',
    meaning: 'The Three of Swords offers language for hurt, separation, or a difficult truth. Naming pain can be useful without rehearsing the harshest possible explanation of it. Separate what happened from conclusions about your worth or your future. Make room for support and for a response that does not have to be immediate.',
    learn: 'The pierced heart is symbolic language for emotional pain and the force of words or understanding. It does not establish betrayal or predict a loss.'
  },
  {
    id: 53, name: 'Four of Swords', group: 'reflection',
    theme: 'allowing rest to interrupt a cycle of mental effort',
    gift: 'a protected interval in which urgency can settle',
    friction: 'calling a pause unproductive while your attention remains depleted',
    release: 'the expectation that another round of thinking will always help',
    action: 'set aside a period without problem-solving and decide when you will return to the question',
    question: 'What kind of pause would let you return with more capacity?',
    meaning: 'The Four of Swords asks whether more effort is what the question needs right now. A deliberate pause can let attention recover without abandoning responsibility. Give the pause a shape: fewer demands, a quiet interval, or an agreed time to return. Rest need not produce an insight to be worthwhile.',
    learn: 'The resting figure contrasts with the suit’s sharp implements. The card traditionally concerns retreat, recovery, and a temporary cessation of conflict or exertion.'
  },
  {
    id: 54, name: 'Five of Swords', group: 'structure',
    theme: 'examining the cost of prevailing in a disagreement',
    gift: 'discernment about which conflicts deserve your participation',
    friction: 'winning a point while damaging what the conversation was meant to protect',
    release: 'the need to have the last word',
    action: 'identify what an argument is costing and choose a boundary, repair, or exit from the exchange',
    question: 'What outcome would matter more than proving yourself right?',
    meaning: 'The Five of Swords asks what a victory costs. In a strained exchange, proving a point can displace the reason for speaking at all. Consider the effects on trust, dignity, and your own attention. A fair boundary, a repair, or stepping away may serve you better than continuing on the same terms.',
    learn: 'The contrasting figures after a conflict complicate the idea of victory. This card explores contention and its aftermath without identifying anyone as an enemy.'
  },
  {
    id: 55, name: 'Six of Swords', group: 'transition',
    theme: 'moving toward more workable conditions while carrying what you have learned',
    gift: 'a measured transition supported by practical help',
    friction: 'expecting a change of setting to resolve every difficulty at once',
    release: 'the demand to feel completely ready before accepting a gentler arrangement',
    action: 'plan one manageable transition and identify what support will make it easier',
    question: 'What could make the next stage a little more workable than the present one?',
    meaning: 'The Six of Swords considers a passage from strain toward conditions that may be easier to navigate. Progress can be quiet and accompanied by mixed feelings. Think about the practical help, preparation, or company that makes a transition possible. You can carry learning forward without expecting the new setting to solve everything.',
    learn: 'A boat carrying passengers and swords connects movement with burdens that travel too. The traditional image emphasises passage, assistance, and gradual change.'
  },
  {
    id: 56, name: 'Seven of Swords', group: 'reflection',
    theme: 'examining the relationship between strategy and honesty',
    gift: 'resourcefulness and care about what you disclose',
    friction: 'avoiding a necessary conversation through increasingly complicated manoeuvres',
    release: 'the assumption that the indirect route has fewer consequences',
    action: 'review one workaround and ask whether a clearer agreement would serve better',
    question: 'Is this strategy protecting a legitimate need, or postponing something you need to address?',
    meaning: 'The Seven of Swords looks at indirect approaches: discretion, improvisation, or a workaround. Context determines whether a strategy protects something important or creates another difficulty. Examine your own choices and the facts available. The card is not evidence that someone is deceiving you; it offers a question about clarity and accountability.',
    learn: 'The figure carrying swords away has traditionally raised themes of strategy, secrecy, and evasion. These themes require context and do not prove another person’s intentions.'
  },
  {
    id: 57, name: 'Eight of Swords', group: 'reflection',
    theme: 'distinguishing actual limits from an explanation that leaves no room',
    gift: 'careful attention to one available choice or source of help',
    friction: 'treating a difficult situation as if no part of it can be examined',
    release: 'self-blame for constraints you did not choose',
    action: 'separate a real constraint from an assumption and identify one person or resource that could clarify your options',
    question: 'Within the limits that are real, where might support create a little more room?',
    meaning: 'The Eight of Swords asks how a situation of constraint is being understood. Some limits are real and cannot be removed by a change of attitude. Others may become clearer with information or support. Look for one part you can examine safely, without blaming yourself for not having a complete way through.',
    learn: 'A bound figure surrounded by swords brings restriction and perception together. A reflective reading should acknowledge material limits rather than reduce every barrier to a mindset.'
  },
  {
    id: 58, name: 'Nine of Swords', group: 'reflection',
    theme: 'meeting worry without treating it as a forecast',
    gift: 'the ability to name a fear and seek a steadier perspective',
    friction: 'rehearsing a feared outcome as though repetition makes it more certain',
    release: 'the obligation to solve every worry alone or immediately',
    action: 'write the worry beside what you know and choose one source of practical or personal support',
    question: 'Which part of this worry needs information, and which part needs company or rest?',
    meaning: 'The Nine of Swords gives form to the way worry can fill an entire field of attention. A vivid fear is not evidence that its outcome will happen. Put the concern into words, separate it from what is known, and consider what kind of support would help. You need not reason through everything alone.',
    learn: 'The wakeful figure beneath nine swords evokes anguish and repeated thought. It is a symbol for examining distress, not a diagnosis or prediction.'
  },
  {
    id: 59, name: 'Ten of Swords', group: 'transition',
    theme: 'acknowledging a limit without making it a verdict on your future',
    gift: 'clarity about what cannot continue in its present form',
    friction: 'reopening an exhausted situation in search of a different ending',
    release: 'the belief that a painful ending defines your whole story',
    action: 'name what is over or no longer workable and choose one immediate act of care',
    question: 'What needs acknowledgement before you can decide how to care for what comes next?',
    meaning: 'The Ten of Swords is a dramatic image of reaching a limit. Read it symbolically: an explanation, effort, or arrangement may need to stop being repeated in the same form. There is no need to make an ending a judgement of your worth. Begin with what is concrete and what care is available now.',
    learn: 'The card’s extreme imagery expresses finality and exhaustion. It should not be read as a literal prediction of injury, death, or inevitable disaster.'
  },
  {
    id: 60, name: 'Page of Swords', group: 'reflection',
    theme: 'turning curiosity into careful questions',
    gift: 'alertness and a willingness to investigate an unfamiliar idea',
    friction: 'drawing a conclusion from the first interesting piece of information',
    release: 'the pressure to sound certain while you are still learning',
    action: 'ask a precise question and check the source of one claim before repeating it',
    question: 'What would a better question help you notice?',
    meaning: 'The Page of Swords values the lively moment when a question becomes interesting. Follow that curiosity with care: listen, check the source, and leave room to revise what you think. Being new to a subject does not prevent a good question. It does make the distinction between noticing and knowing especially useful.',
    learn: 'The Page’s raised sword and alert posture express intellectual curiosity. The card explores inquiry and communication, including the impatience of a quick conclusion.'
  },
  {
    id: 61, name: 'Knight of Swords', group: 'movement',
    theme: 'acting on a clear idea without outrunning your understanding',
    gift: 'decisiveness and the courage to address an issue directly',
    friction: 'letting urgency silence context or another person’s perspective',
    release: 'the belief that certainty gives you permission to stop listening',
    action: 'state your aim and check one crucial assumption before sending the message or making the move',
    question: 'What might you miss if you act at the speed of your first conclusion?',
    meaning: 'The Knight of Swords brings force and direction to a thought. Direct action can be useful when an issue needs addressing, but intensity can outrun understanding. Before committing, check the assumption on which the action depends. Give other people enough room to respond, and leave yourself a way to change course.',
    learn: 'The charging Knight expresses the suit’s mental energy in motion. Determination and directness appear alongside the risk of haste or a narrowed view.'
  },
  {
    id: 62, name: 'Queen of Swords', group: 'structure',
    theme: 'speaking with clarity that respects both facts and people',
    gift: 'discernment and an honest, well-defined boundary',
    friction: 'using sharpness to protect yourself from a more vulnerable truth',
    release: 'the obligation to soften a clear boundary until its meaning disappears',
    action: 'say what you know, what you need, and what remains open to discussion',
    question: 'How could you be precise without becoming needlessly cutting?',
    meaning: 'The Queen of Swords gives language a clear edge. Say what you mean and distinguish a fact from an interpretation. A boundary can be direct without becoming a punishment, and compassion need not make it vague. Notice whether detachment is helping you see clearly or keeping something important out of the conversation.',
    learn: 'An upright sword and an open hand bring discernment and communication together. The Queen represents a quality of judgement available to anyone, rather than a gendered role.'
  },
  {
    id: 63, name: 'King of Swords', group: 'structure',
    theme: 'using judgement in a way that is clear and accountable',
    gift: 'reasoned decisions supported by consistent standards',
    friction: 'treating authority or confidence as a substitute for evidence',
    release: 'the belief that revising a decision weakens your credibility',
    action: 'explain the reasons for a decision and name what evidence could change it',
    question: 'Could someone understand your reasoning even if they disagreed with the conclusion?',
    meaning: 'The King of Swords examines how judgement is exercised. Make the standard clear, attend to evidence, and include the effects on people who will live with the decision. Being authoritative need not mean being unchangeable. A reasoned position can explain itself and remain open to information that genuinely alters the picture.',
    learn: 'The King of Swords is associated with reason, authority, and principled judgement. Reflective use asks how these qualities are made fair and accountable.'
  },
  {
    id: 64, name: 'Ace of Pentacles', group: 'movement',
    theme: 'giving a practical possibility conditions in which to develop',
    gift: 'a tangible starting point that can be tended over time',
    friction: 'treating an available resource as a guaranteed outcome',
    release: 'the demand for a small opportunity to solve everything',
    action: 'identify one available resource and make a realistic first use of it',
    question: 'What modest, tangible beginning could you support consistently?',
    meaning: 'The Ace of Pentacles turns toward something tangible: time, a skill, a material resource, or an opening you can work with. Its value depends partly on the conditions you can offer it. Begin with a practical assessment, then take a manageable step. Potential becomes useful through attention rather than a promise of reward.',
    learn: 'Pentacles traditionally concern material life, work, resources, and the body. Their Ace expresses practical potential; it does not guarantee income, health, or success.'
  },
  {
    id: 65, name: 'Two of Pentacles', group: 'structure',
    theme: 'adjusting competing demands to fit your actual capacity',
    gift: 'flexibility about timing, priorities, and changing circumstances',
    friction: 'keeping everything moving without noticing the cost of constant switching',
    release: 'the expectation that every commitment deserves equal attention at every moment',
    action: 'rank this week’s demands and move one commitment to a more realistic time',
    question: 'What could become simpler if you stopped trying to keep every demand in motion?',
    meaning: 'The Two of Pentacles asks how your time and resources move between demands. Flexibility can help, but constant adjustment has a cost. Look at what is actually possible rather than how gracefully you think you should manage it. A change of sequence, a clearer priority, or a smaller commitment may create useful breathing room.',
    learn: 'Two pentacles linked by a looping ribbon evoke ongoing adjustment. The card explores juggling responsibilities rather than an ideal of effortless balance.'
  },
  {
    id: 66, name: 'Three of Pentacles', group: 'connection',
    theme: 'bringing different skills into shared work',
    gift: 'collaboration grounded in respect for each contribution',
    friction: 'assuming others understand the standard or division of responsibility',
    release: 'the need to prove your competence by working without feedback',
    action: 'clarify a shared standard and ask someone with a different skill to review one part of the work',
    question: 'Whose contribution would improve this if you made room for it?',
    meaning: 'The Three of Pentacles looks at the craft of working together. Different skills become useful when people understand the task, the standard, and their responsibilities. Ask for specific feedback and give credit where it belongs. Learning through collaboration can strengthen your own judgement rather than replace it.',
    learn: 'The traditional architectural scene brings a maker and other contributors together. Craft, learning, and coordination are central to its symbolism.'
  },
  {
    id: 67, name: 'Four of Pentacles', group: 'structure',
    theme: 'examining what security asks you to hold and what it allows you to use',
    gift: 'stewardship that protects resources and establishes a boundary',
    friction: 'holding so tightly that a resource can no longer serve its purpose',
    release: 'the assumption that any change threatens everything you have built',
    action: 'name what you need to protect and one small use of your resources that still feels sustainable',
    question: 'What is this boundary safeguarding, and has it become more restrictive than necessary?',
    meaning: 'The Four of Pentacles considers the desire for security. Protecting time, energy, possessions, or money can be sensible, especially where resources are limited. Look at whether the boundary still serves its purpose. The question is not whether you should give something away, but whether holding it this way supports the life you want.',
    learn: 'The tightly held pentacles make preservation and possessiveness visible together. The card invites context about scarcity and security, rather than labelling caution as a flaw.'
  },
  {
    id: 68, name: 'Five of Pentacles', group: 'connection',
    theme: 'recognising hardship and looking for accessible support',
    gift: 'solidarity and a concrete understanding of what help is needed',
    friction: 'carrying a practical difficulty in silence because it feels shameful',
    release: 'the belief that needing help diminishes your worth',
    action: 'name one specific difficulty and identify a person, service, or resource that may be able to help',
    question: 'What kind of practical support would make the most immediate difference?',
    meaning: 'The Five of Pentacles gives material strain and the feeling of being outside a place of support room to be acknowledged. Hardship is not a measure of your worth. Describe the need as concretely as you can and consider what help is actually accessible. You do not have to make a difficult condition into a lesson.',
    learn: 'Figures outside a lit building evoke exclusion, hardship, and possible support. The image does not predict poverty or illness, nor imply that help is always easy to obtain.'
  },
  {
    id: 69, name: 'Six of Pentacles', group: 'connection',
    theme: 'making the terms of giving and receiving more considered',
    gift: 'generosity that responds to a real need',
    friction: 'an unequal exchange whose expectations remain unspoken',
    release: 'the assumption that help must create an indefinite obligation',
    action: 'clarify what is being offered, what is needed, and whether any expectations come with the exchange',
    question: 'How could this exchange protect the dignity and limits of everyone involved?',
    meaning: 'The Six of Pentacles examines an exchange of help, time, attention, or material resources. Generosity becomes clearer when it responds to a real need and leaves its expectations visible. Consider both giving and receiving. A useful arrangement respects the dignity of the person receiving and the capacity of the person offering.',
    learn: 'Coins and scales connect assistance with fairness and unequal positions. The card asks about the terms of generosity, not simply its amount.'
  },
  {
    id: 70, name: 'Seven of Pentacles', group: 'reflection',
    theme: 'reviewing what sustained effort is producing',
    gift: 'patience joined with an honest assessment of progress',
    friction: 'continuing only because you have already invested so much',
    release: 'the expectation that patience means never changing the plan',
    action: 'review one ongoing effort against a clear measure and choose what to continue, adjust, or stop',
    question: 'What is the work teaching you about where to place your next effort?',
    meaning: 'The Seven of Pentacles pauses to examine an investment of time and care. Some results develop slowly, but waiting and persistence are not automatically the right answer. Look at what is growing, what the effort costs, and what evidence would justify another approach. Use the review to decide where your next attention belongs.',
    learn: 'A worker looking at growing pentacles expresses patience and evaluation. The card combines cultivation with a practical question about the return on effort.'
  },
  {
    id: 71, name: 'Eight of Pentacles', group: 'movement',
    theme: 'developing skill through attentive repetition',
    gift: 'craftsmanship that notices and improves a specific detail',
    friction: 'repeating the work without feedback or a clear learning aim',
    release: 'the need for every practice session to produce a polished result',
    action: 'choose one part of a skill to practise and compare the result with a useful standard',
    question: 'Which detail would repay careful practice rather than more general effort?',
    meaning: 'The Eight of Pentacles gives dignity to practice. Progress often comes from attending to a specific detail, trying again, and noticing the difference. Choose what you are learning rather than measuring only how long you worked. Good craft includes feedback, rest, and a standard that helps you see what to improve.',
    learn: 'The repeated making of pentacles connects this card with apprenticeship and skill. Repetition becomes meaningful when attention and learning remain present.'
  },
  {
    id: 72, name: 'Nine of Pentacles', group: 'structure',
    theme: 'enjoying autonomy while recognising what sustains it',
    gift: 'self-trust grounded in care for your surroundings and resources',
    friction: 'treating independence as a reason never to rely on anyone',
    release: 'the obligation to earn every moment of comfort through more work',
    action: 'enjoy one thing you have carefully built and acknowledge the support that makes it possible',
    question: 'What form of independence gives you room to live well, rather than simply manage alone?',
    meaning: 'The Nine of Pentacles attends to the pleasures of something carefully cultivated: a skill, a space, a routine, or greater freedom in your decisions. Let yourself enjoy what it offers. Autonomy can coexist with gratitude for support, and comfort need not become another standard you must display to others.',
    learn: 'A figure in a cultivated garden evokes discernment, independence, and enjoyment of material life. These themes need not be reduced to wealth or luxury.'
  },
  {
    id: 73, name: 'Ten of Pentacles', group: 'structure',
    theme: 'considering what your arrangements pass on to others',
    gift: 'continuity supported by shared resources and accumulated knowledge',
    friction: 'preserving an inherited arrangement without examining who it includes',
    release: 'the obligation to continue every family or institutional expectation unchanged',
    action: 'identify one useful practice to preserve and one inherited assumption to discuss',
    question: 'What would you like your present choices to make possible for those who come after?',
    meaning: 'The Ten of Pentacles takes a longer view of belonging and resources. Consider what is handed down: skills, property, responsibilities, habits, and expectations. Continuity can offer support while carrying assumptions worth revisiting. Ask what you want to preserve and what should change so that the arrangement serves the people within it.',
    learn: 'Generations gathered in a shared setting connect the card with legacy and continuity. It examines inheritance broadly, without promising a financial windfall.'
  },
  {
    id: 74, name: 'Page of Pentacles', group: 'movement',
    theme: 'turning interest into a practical course of learning',
    gift: 'patient attention to the basics of an unfamiliar skill',
    friction: 'collecting plans or materials instead of beginning the practice',
    release: 'the expectation that being a beginner makes your effort less valuable',
    action: 'choose one practical learning task and give it a specific place in your week',
    question: 'What small piece of knowledge could you make useful through practice?',
    meaning: 'The Page of Pentacles brings an interested, practical gaze to something you want to learn. Start where you are and make the next task concrete. A modest routine can turn curiosity into familiarity more effectively than a large plan. Notice what the material itself teaches when you spend time working with it.',
    learn: 'The Page studies a pentacle closely. Learning, diligence, and practical beginnings are its themes; a court card can describe an approach rather than a person.'
  },
  {
    id: 75, name: 'Knight of Pentacles', group: 'structure',
    theme: 'making progress through a dependable pace',
    gift: 'follow-through that makes commitments believable',
    friction: 'continuing a routine after it has stopped serving its purpose',
    release: 'the assumption that changing your method makes you unreliable',
    action: 'complete one manageable task and review whether the routine around it still works',
    question: 'What pace could you keep without becoming trapped by the method?',
    meaning: 'The Knight of Pentacles gives attention to what happens through repeated, dependable effort. Make a commitment small enough to uphold and clear enough to assess. Steadiness is useful, but a familiar method can still need revision. Reliability includes noticing when the conditions have changed and adjusting honestly.',
    learn: 'The relatively still Knight contrasts with the other Knights’ movement. Its symbolism emphasises diligence, patience, and the possible rigidity of an established routine.'
  },
  {
    id: 76, name: 'Queen of Pentacles', group: 'connection',
    theme: 'making everyday care practical and sustainable',
    gift: 'resourcefulness that attends to comfort and material needs',
    friction: 'providing for everyone while leaving your own needs out of the arrangement',
    release: 'the expectation that care must always be available from you',
    action: 'make one practical improvement to daily life and include your own comfort in the decision',
    question: 'What would care look like if the person offering it were included too?',
    meaning: 'The Queen of Pentacles notices the tangible conditions of a day: nourishment, tools, a welcoming space, and enough time to use them. Practical care can be generous without becoming endless provision. Look for a small arrangement that supports real needs, including your own, and that can continue without exhausting the person maintaining it.',
    learn: 'The Queen holds a pentacle within a living landscape. This links resourcefulness and nurture with everyday material life, without assigning care to a particular gender.'
  },
  {
    id: 77, name: 'King of Pentacles', group: 'structure',
    theme: 'stewarding resources with a longer view of their purpose',
    gift: 'practical judgement that makes stability useful to others',
    friction: 'measuring security or worth only through what can be accumulated',
    release: 'the belief that protecting resources requires keeping complete control of them',
    action: 'review how a resource you manage supports the people and commitments it is meant to serve',
    question: 'What is the stability you are building meant to make possible?',
    meaning: 'The King of Pentacles asks how resources are managed once they become a responsibility. Stability has a purpose beyond preserving itself: it can support good work, reliable commitments, and other people’s capacity to thrive. Consider whether your decisions serve that purpose. Practical stewardship combines care for the future with attention to present needs.',
    learn: 'The King brings the suit’s material concerns into stewardship and accountability. It describes qualities of practical leadership, not a promise of wealth or status.'
  }
];

const sentence = text => `${text[0].toUpperCase()}${text.slice(1)}.`;

export const MINOR_NOTES = Object.fromEntries(entries.map(card => [card.id, {
  meaning: card.meaning,
  prompt: card.question,
  practice: sentence(card.action),
  learn: card.learn
}]));

// A reversal changes the angle of reflection; it is not a prediction of harm.
// Each card retains its own tension, release and practical response.
export const MINOR_REVERSED_NOTES = Object.fromEntries(entries.map(card => [card.id, {
  meaning: `${card.name} reversed turns attention toward ${card.friction}. Notice whether the quality of ${card.gift} feels difficult to access, has become excessive, or needs a different expression. You can explore this without deciding that anything is wrong with you. Consider loosening ${card.release}; a useful response may be to ${card.action}.`,
  prompt: `Where do you recognise ${card.friction}, and what would a more workable response look like?`,
  practice: sentence(card.action),
  learn: card.learn
}]));

export const MINOR_LENSES = entries.map(({ name, group, theme, gift, friction, release, action, question }) => ({
  name, group, theme, gift, friction, release, action, question
}));

export const MINOR_EDITORIAL = entries.map(card => ({
  focus: card.theme,
  resource: card.gift,
  friction: card.friction,
  loosen: card.release,
  step: sentence(card.action)
}));
