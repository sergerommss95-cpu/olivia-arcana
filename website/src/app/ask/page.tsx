'use client';

import { useEffect, useRef, useState } from 'react';
import AlmanacShell from '@/components/almanac/AlmanacShell';
import { useLocale } from '@/lib/i18n/useLocale';
import { ChatError, questionServiceAvailable, streamChat, type ChatMessage } from '@/lib/chat-client';
import { clearQuestionHandoff, readQuestionHandoff, writeQuestionHandoff } from '@/lib/question-handoff';

const COPY = {
  en: {
    kicker: 'A LITTLE ROOM TO THINK', title: 'Begin with your question.',
    intro: 'Put a situation into words. An AI-assisted conversation can help you find a clearer question for your reading.',
    checking: 'Checking whether the interpretation service is connected…',
    unavailable: 'The AI conversation is not connected yet. You can still choose cards, explore their meanings and keep your own reflection.',
    disclosure: 'When you send, this conversation is shared with our AI provider to prepare your response. Your saved almanac is not sent. This page helps you reflect; it does not draw cards or predict events.',
    placeholder: 'What would you like to understand more clearly?', label: 'Your question', send: 'Explore my question', waiting: 'Considering your question…',
    handoffTitle: 'The question you take with you', handoffHelp: 'Edit this into your own words. You will choose the cards on the next screen.', handoffError: 'This browser could not carry your question across. Copy it before continuing.', reading: 'Choose cards for my question', retry: 'Try again', source: 'AI-assisted reflection',
    rate: 'You have reached the hourly question limit. Your question is still here. Please try again later.',
    error: 'The conversation could not continue. Your question is still here; please try again.',
    examples: ['I am considering changing jobs. What should I think through?', 'How can I approach a difficult conversation?', 'I feel pulled in two directions. Where can I begin?'],
  },
  uk: {
    kicker: 'ПРОСТІР ДЛЯ РОЗДУМІВ', title: 'Почніть зі свого запитання.',
    intro: 'Опишіть ситуацію своїми словами. Розмова за допомогою ШІ може допомогти сформулювати чіткіше запитання до розкладу.',
    checking: 'Перевіряємо доступність сервісу тлумачення…',
    unavailable: 'Розмову з ШІ ще не підключено. Ви можете обрати карти, дослідити їхні значення й зберегти власні роздуми.',
    disclosure: 'Після натискання кнопки ця розмова буде передана нашому постачальнику ШІ для підготовки відповіді. Записи альманаху не передаються. Ця сторінка допомагає міркувати; вона не витягує карти й не передбачає події.',
    placeholder: 'Що ви хотіли б зрозуміти краще?', label: 'Ваше запитання', send: 'Дослідити запитання', waiting: 'Обмірковуємо ваше запитання…',
    handoffTitle: 'Запитання, яке ви берете із собою', handoffHelp: 'Сформулюйте його власними словами. На наступному екрані ви оберете карти.', handoffError: 'Браузер не зміг перенести запитання. Скопіюйте його перед переходом.', reading: 'Обрати карти до запитання', retry: 'Спробувати ще раз', source: 'Роздуми за допомогою ШІ',
    rate: 'Досягнуто ліміту запитань на годину. Ваше запитання збережене тут. Спробуйте пізніше.',
    error: 'Не вдалося продовжити розмову. Ваше запитання збережене тут; спробуйте ще раз.',
    examples: ['Я думаю про зміну роботи. Що варто зважити?', 'Як підійти до складної розмови?', 'Мене тягне у два різні боки. З чого почати?'],
  },
};

export default function AskPage() {
  const { locale } = useLocale();
  const language = locale === 'uk' ? 'uk' : 'en';
  const copy = COPY[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [retryQuestion, setRetryQuestion] = useState('');
  const [readingQuestion, setReadingQuestion] = useState('');
  const [handoffError, setHandoffError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const question = readQuestionHandoff(sessionStorage);
      if (question !== null) setInput(question);
    } catch { /* A blocked session store must not prevent a fresh question. */ }
    const check = new AbortController();
    questionServiceAvailable(check.signal).then(setAvailable).catch(() => { if (!check.signal.aborted) setAvailable(false); });
    return () => { check.abort(); controller.current?.abort(); };
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); }, [messages, waiting]);

  function editInput(question: string) {
    setInput(question);
    try { writeQuestionHandoff(sessionStorage, question); } catch { /* Typing works even when tab storage is blocked. */ }
  }

  async function send(question = input.trim()) {
    if (!question || question.length > 1600 || waiting || available !== true) return;
    setWaiting(true); setReadingQuestion(question); setError(''); setRetryQuestion('');
    // Keep at most five complete turns; the final user question is always included.
    const history: ChatMessage[] = [...messages.slice(-10), { role: 'user', content: question }];
    controller.current?.abort(); controller.current = new AbortController();
    try {
      let answer = '';
      for await (const token of streamChat(history, language, controller.current.signal)) answer += token;
      setMessages([...history, { role: 'assistant', content: answer }]);
      setInput('');
      try { clearQuestionHandoff(sessionStorage); } catch { /* The current conversation remains usable. */ }
    } catch (cause) {
      if (controller.current.signal.aborted) return;
      setRetryQuestion(question);
      setError(cause instanceof ChatError && cause.status === 429 ? copy.rate : copy.error);
      if (cause instanceof ChatError && cause.status === 503) { setAvailable(false); setError(copy.unavailable); }
    } finally { setWaiting(false); inputRef.current?.focus(); }
  }

  function carryQuestion(event: React.MouseEvent<HTMLAnchorElement>) {
    const question = (readingQuestion || input).trim();
    try { writeQuestionHandoff(sessionStorage, question); }
    catch { event.preventDefault(); setHandoffError(copy.handoffError); }
  }

  return <AlmanacShell narrow>
    <div className="ask">
      <header className="ask-head">
        <p className="alm-kicker">{copy.kicker}</p>
        <h1 className="alm-h1">{copy.title}</h1>
        <p className="ask-intro">{copy.intro}</p>
      </header>
      <div className="ask-messages" role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((message, index) => <article className={`message ${message.role}`} key={index}>
          <p className="message-label">{message.role === 'user' ? copy.label : copy.source}</p>
          <p>{message.content}</p>
        </article>)}
        {waiting && <p role="status">{copy.waiting}</p>}
        <div ref={endRef} />
      </div>
      {available === null && <p role="status">{copy.checking}</p>}
      {available === false && <><p className="service-notice" role="status">{copy.unavailable}</p>{input.trim() && <article className="message user"><p className="message-label">{copy.label}</p><p>{input}</p></article>}</>}
      {available === true && <>
        {messages.length === 0 && <div className="ask-suggestions">{copy.examples.map(example => <button type="button" key={example} onClick={() => { editInput(example); inputRef.current?.focus(); }}>{example}<span aria-hidden="true">↗</span></button>)}</div>}
        <form onSubmit={event => { event.preventDefault(); void send(); }}>
          <label htmlFor="question">{copy.label}</label>
          <textarea ref={inputRef} id="question" placeholder={copy.placeholder} maxLength={1600} rows={4} value={input} onChange={event => { editInput(event.target.value); setRetryQuestion(''); setError(''); }} disabled={waiting} aria-describedby="question-disclosure" />
          <p className="disclosure" id="question-disclosure">{copy.disclosure}</p>
          <button className="primary-action" type="submit" disabled={waiting || !input.trim()}>{waiting ? copy.waiting : copy.send}<span aria-hidden="true">↗</span></button>
        </form>
      </>}
      {error && <div role="alert" className="service-notice"><p>{error}</p>{available && retryQuestion && <button type="button" className="retry" onClick={() => void send(retryQuestion)} disabled={waiting}>{copy.retry}</button>}</div>}
      {(readingQuestion || messages.length > 0) && <section className="handoff-question">
        <label htmlFor="reading-question">{copy.handoffTitle}</label>
        <textarea id="reading-question" maxLength={1600} rows={3} value={readingQuestion} onChange={event => {setReadingQuestion(event.target.value); setHandoffError('');}} />
        <p className="disclosure">{copy.handoffHelp}</p>
      </section>}
      {handoffError && <p role="alert">{handoffError}</p>}
      <a className="reading-link" onClick={carryQuestion} href={language === 'uk' ? '/uk/?experience=question' : '/?experience=question'}>{copy.reading}<span aria-hidden="true">↗</span></a>
    </div>
    <style jsx>{`
      .ask { color: #eee5d2; --ink: #eee5d2; --ink-soft: #b4c0c7; --hairline: rgba(222,208,178,.24); }
      .ask-head { padding-bottom: 2rem; border-bottom: 1px solid var(--hairline); }
      .ask-head :global(.alm-h1) { font-size: clamp(2.7rem,5vw,4.5rem); line-height:1.02; }
      .ask-intro { color: var(--ink-soft); max-width: 52ch; line-height:1.8; margin-top:1.25rem; }
      .ask-messages { display:flex; flex-direction:column; gap:1.5rem; margin-top:2rem; }
      .message { padding:1.25rem 1.5rem; border-left:1px solid var(--hairline); background: rgba(12,33,48,.45); }
      .message.user { margin-left:2rem; background:rgba(234,224,203,.05); }
      .message p { line-height:1.8; white-space:pre-wrap; margin:0; }
      .message .message-label { font-size:.68rem; letter-spacing:.13em; text-transform:uppercase; color:#bba77e; margin-bottom:.6rem; }
      .ask-suggestions { display:grid; gap:.6rem; margin:1.6rem 0 2rem; }
      .ask-suggestions button { color:var(--ink); background:rgba(219,220,209,.04); border:1px solid var(--hairline); padding:1rem; display:flex; gap:1rem; justify-content:space-between; text-align:left; font:inherit; cursor:pointer; }
      .ask-suggestions button:hover { background:rgba(219,220,209,.1); }
      label { display:block; margin-bottom:.6rem; font-size:.85rem; }
      textarea { width:100%; resize:vertical; border:1px solid rgba(232,218,187,.45); border-radius:5px; padding:1rem; color:var(--ink); background:#0a1b2a; font:inherit; line-height:1.7; }
      textarea::placeholder { color:#95a7b1; }
      textarea:focus-visible,button:focus-visible,a:focus-visible { outline:2px solid #d3b77f; outline-offset:4px; }
      .disclosure { font-size:.78rem; color:var(--ink-soft); line-height:1.7; margin:1rem 0; }
      .primary-action { min-height:52px; padding:.9rem 1.2rem; background:#e8ddc5; color:#0a1b2a; border:1px solid #e8ddc5; border-radius:4px; font:inherit; cursor:pointer; display:flex; gap:2rem; justify-content:space-between; }
      button:disabled { opacity:.5; cursor:wait; }
      .service-notice { border:1px solid var(--hairline); padding:1.2rem; line-height:1.75; color:var(--ink-soft); }
      .retry { background:none; color:var(--ink); border:0; border-bottom:1px solid #bba77e; padding:.6rem 0; font:inherit; cursor:pointer; }
      .handoff-question { margin-top:2.5rem; padding-top:1.5rem; border-top:1px solid var(--hairline); }
      .reading-link { display:flex; justify-content:space-between; padding:1.2rem 0; margin-top:1.5rem; border-bottom:1px solid var(--hairline); color:var(--ink); text-decoration:none; }
      @media(max-width:600px) { .message.user { margin-left:.8rem; } .primary-action { width:100%; } }
    `}</style>
  </AlmanacShell>;
}
