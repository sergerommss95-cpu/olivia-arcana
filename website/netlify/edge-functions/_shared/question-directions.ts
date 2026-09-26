// Trusted editorial plan v1, mirrored from the question coach. Never use client-supplied position text.
export const QUESTION_DIRECTIONS = {
  "en": {
    "understand": [
      {
        "id": "situation",
        "label": "What is here",
        "prompt": "What can I actually observe in this situation?"
      },
      {
        "id": "complication",
        "label": "What needs a closer look",
        "prompt": "What assumption or tension could change how I see it?"
      },
      {
        "id": "next-step",
        "label": "A way forward",
        "prompt": "What small step would help me understand more?"
      }
    ],
    "decision": [
      {
        "id": "situation",
        "label": "The choice before you",
        "prompt": "What value or need matters in the choice I am facing?"
      },
      {
        "id": "complication",
        "label": "What makes it difficult",
        "prompt": "What uncertainty, pressure or assumption complicates my choice?"
      },
      {
        "id": "next-step",
        "label": "Before you decide",
        "prompt": "What could I check, ask or try before committing?"
      }
    ],
    "conversation": [
      {
        "id": "situation",
        "label": "What you bring",
        "prompt": "What do I want to express about my own experience?"
      },
      {
        "id": "complication",
        "label": "What may get in the way",
        "prompt": "What assumption or reaction could make listening harder?"
      },
      {
        "id": "next-step",
        "label": "A considered beginning",
        "prompt": "What could I say or ask to open the conversation with care?"
      }
    ],
    "original": [
      {
        "id": "situation",
        "label": "The situation",
        "prompt": "What aspect of the situation deserves attention?"
      },
      {
        "id": "complication",
        "label": "What complicates it",
        "prompt": "What tension or assumption deserves a closer look?"
      },
      {
        "id": "next-step",
        "label": "A helpful next step",
        "prompt": "What small action could help you understand or respond?"
      }
    ]
  },
  "uk": {
    "understand": [
      {
        "id": "situation",
        "label": "Що є зараз",
        "prompt": "Що я можу безпосередньо спостерігати в цій ситуації?"
      },
      {
        "id": "complication",
        "label": "Що потребує уваги",
        "prompt": "Яке припущення чи напруга можуть змінити мій погляд?"
      },
      {
        "id": "next-step",
        "label": "Шлях уперед",
        "prompt": "Який невеликий крок допоможе мені зрозуміти більше?"
      }
    ],
    "decision": [
      {
        "id": "situation",
        "label": "Вибір перед вами",
        "prompt": "Яка цінність або потреба важлива у виборі, перед яким я стою?"
      },
      {
        "id": "complication",
        "label": "Що ускладнює вибір",
        "prompt": "Яка невизначеність, тиск чи припущення ускладнюють мій вибір?"
      },
      {
        "id": "next-step",
        "label": "Перш ніж вирішити",
        "prompt": "Що я можу перевірити, запитати чи спробувати перед рішенням?"
      }
    ],
    "conversation": [
      {
        "id": "situation",
        "label": "З чим ви приходите",
        "prompt": "Що я хочу висловити про власний досвід?"
      },
      {
        "id": "complication",
        "label": "Що може завадити",
        "prompt": "Яке припущення чи реакція можуть завадити слухати?"
      },
      {
        "id": "next-step",
        "label": "Уважний початок",
        "prompt": "Що я можу сказати чи запитати, щоб дбайливо почати розмову?"
      }
    ],
    "original": [
      {
        "id": "situation",
        "label": "Ситуація",
        "prompt": "Яка частина ситуації заслуговує на увагу?"
      },
      {
        "id": "complication",
        "label": "Що її ускладнює",
        "prompt": "Яку напругу чи припущення варто розглянути уважніше?"
      },
      {
        "id": "next-step",
        "label": "Корисний наступний крок",
        "prompt": "Яка невелика дія допоможе зрозуміти ситуацію або відповісти на неї?"
      }
    ]
  }
} as const;
export type QuestionDirection = keyof typeof QUESTION_DIRECTIONS.en;
